// Guardrails del cron de avances. No pega a la red ni a Supabase.
// Uso: npx tsx scripts/verify-avances-builders.ts
import {
  alreadyPostedToday,
  buildCopy,
  buildLogPayload,
  chooseAvance,
  isArtFriday,
  isAvancesAuthorized,
  isAvancesDryRun,
  isAvancesEnabled,
  isCreateEcho,
  launchCandidate,
  parseInstagramHandle,
  postedLogsFromRows,
  withAdditionalPost,
  projectCandidate,
  runAvancesBuilders,
  updateCandidate,
  xHandleFromMention,
  xWeightedLength,
  type AvanceCandidate,
  type AvancesLogInsert,
  type AvancesPublishers,
  type AvancesStore,
  type ChannelAttempt,
  type PostedLog,
  type PublicBlock,
  type PublicProfile,
} from "../lib/avances-builders";
import { parseBufferCreateBody } from "../lib/buffer-post";

let failed = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (!ok) failed++;
  console.log(`${ok ? "✓" : "✗"} ${name}${ok || !detail ? "" : `\n    ${detail}`}`);
}

const NOW = new Date("2026-11-13T14:00:00.000Z"); // viernes 11:00 ART
const RUN_DATE = "2026-11-13";

function profile(id: string, username: string, name: string): PublicProfile {
  return { id, username, name };
}

function block(partial: Partial<PublicBlock> & Pick<PublicBlock, "id" | "user_id">): PublicBlock {
  return {
    type: "project",
    data: { title: partial.id, description: "Una linea publica" },
    visible: true,
    sub_site_id: null,
    created_at: "2026-11-12T12:00:00.000Z",
    ...partial,
  };
}

function candidate(partial: Partial<AvanceCandidate> & Pick<AvanceCandidate, "sourceType" | "sourceId" | "userId">): AvanceCandidate {
  return {
    username: "ana",
    name: "Ana",
    title: "Proyecto",
    description: "Desc",
    url: "https://huevsite.io/ana",
    imageUrl: "https://huevsite.io/api/og/ana",
    featured: false,
    upvoteCount: 0,
    at: "2026-11-12T12:00:00.000Z",
    ...partial,
  };
}

const ana = profile("user-ana", "ana", "Ana");
const bAna = block({ id: "block-ana", user_id: ana.id, data: { title: "Nave", description: "Sale hoy", email: "nope@interno.test", insights: { visits: 4 } } });

// --- prioridad, cooldown, duplicados, ventana ---
{
  const launch = candidate({
    sourceType: "launch",
    sourceId: "launch-1",
    userId: "user-launch",
    username: "leo",
    at: "2026-11-10T12:00:00.000Z",
    featured: false,
    upvoteCount: 1,
  });
  const newerProject = candidate({
    sourceType: "new_project",
    sourceId: "block-new",
    userId: "user-new",
    at: "2026-11-13T10:00:00.000Z",
  });
  const newerUpdate = candidate({
    sourceType: "update",
    sourceId: "block-up",
    userId: "user-up",
    at: "2026-11-13T13:00:00.000Z",
  });
  const picked = chooseAvance({ now: NOW, candidates: [newerUpdate, newerProject, launch], posted: [] });
  check("prioridad launch sobre proyecto y avance", picked.pick?.sourceId === "launch-1");

  const featured = { ...launch, sourceId: "launch-feat", featured: true, upvoteCount: 0, at: "2026-11-08T12:00:00.000Z" };
  const popular = { ...launch, sourceId: "launch-pop", featured: false, upvoteCount: 9, at: "2026-11-13T12:00:00.000Z" };
  const ranked = chooseAvance({ now: NOW, candidates: [popular, featured], posted: [] });
  check("launch featured gana aunque tenga menos votos", ranked.pick?.sourceId === "launch-feat");

  const cooled: PostedLog = {
    userId: "user-launch",
    sourceType: "launch",
    sourceId: "old",
    publishedAt: "2026-11-01T14:00:00.000Z",
    runDate: "2026-11-01",
    status: "posted",
  };
  const afterCool = chooseAvance({ now: NOW, candidates: [launch, newerProject], posted: [cooled] });
  check("cooldown de 21 dias excluye al builder", afterCool.pick?.sourceId === "block-new");

  const oldPost: PostedLog = {
    ...cooled,
    publishedAt: "2026-10-01T14:00:00.000Z",
    runDate: "2026-10-01",
  };
  const cooledExpired = chooseAvance({ now: NOW, candidates: [launch], posted: [oldPost] });
  check("un post de hace mas de 21 dias no enfria", cooledExpired.pick?.sourceId === "launch-1");

  const duplicate: PostedLog = {
    userId: "someone",
    sourceType: "launch",
    sourceId: "launch-1",
    publishedAt: "2026-09-01T14:00:00.000Z",
    runDate: "2026-09-01",
    status: "posted",
  };
  const notAgain = chooseAvance({ now: NOW, candidates: [launch, newerProject], posted: [duplicate] });
  check("no repite la misma fuente posted", notAgain.pick?.sourceId === "block-new");

  const previewRow: PostedLog = { ...duplicate, status: "preview" };
  const previewIgnored = chooseAvance({ now: NOW, candidates: [launch], posted: [previewRow] });
  check("preview no cuenta como publicado", previewIgnored.pick?.sourceId === "launch-1");

  const stale = { ...launch, at: "2026-10-01T12:00:00.000Z" };
  const none = chooseAvance({ now: NOW, candidates: [stale], posted: [] });
  check("fuera de la ventana de 7 dias es no_signal", none.reason === "no_signal" && none.pick === null);

  check("already ran el mismo run_date", alreadyPostedToday([cooled], "2026-11-01"));
  check("otro dia no es already ran", !alreadyPostedToday([cooled], RUN_DATE));

  const merged = withAdditionalPost(
    { texts: { x: "hola" } },
    { sourceType: "new_project", sourceId: "block-other", userId: "user-other", publishedAt: "2026-11-13T14:00:00.000Z" }
  );
  const expanded = postedLogsFromRows([
    { ...cooled, runDate: RUN_DATE, sourceId: "launch-1", sourceType: "launch", userId: "user-launch", payload: merged },
  ]);
  const afterForce = chooseAvance({
    now: NOW,
    candidates: [
      launch,
      candidate({ sourceType: "new_project", sourceId: "block-other", userId: "user-other", at: "2026-11-12T12:00:00.000Z" }),
    ],
    posted: expanded,
  });
  check("un force queda anotado y no repite esa fuente", afterForce.reason === "no_signal");
}

// --- bloques publicos y eco de alta ---
{
  const hidden = launchCandidate(
    {
      id: "l1",
      block_id: bAna.id,
      user_id: ana.id,
      upvote_count: 0,
      featured: false,
      launched_at: "2026-11-12T12:00:00.000Z",
      created_at: "2026-11-12T12:00:00.000Z",
      launch_week: "2026-W46",
      scheduled: false,
    },
    { ...bAna, visible: false },
    ana
  );
  check("launch de bloque oculto no entra", hidden === null);

  const archived = projectCandidate({ ...bAna, data: { ...bAna.data, archived: true } }, ana);
  check("proyecto archivado no entra", archived === null);
  const archivedText = projectCandidate({ ...bAna, data: { ...bAna.data, archived: "true" } }, ana);
  check("archived string true no entra", archivedText === null);

  const subsite = projectCandidate({ ...bAna, sub_site_id: "sub-1" }, ana);
  check("bloque de sub-sitio no entra", subsite === null);

  const scheduled = launchCandidate(
    {
      id: "l2",
      block_id: bAna.id,
      user_id: ana.id,
      upvote_count: 3,
      featured: true,
      launched_at: "2026-11-12T12:00:00.000Z",
      created_at: "2026-11-12T12:00:00.000Z",
      launch_week: "2026-W46",
      scheduled: true,
    },
    bAna,
    ana
  );
  check("launch scheduled no esta live", scheduled === null);

  const echo = updateCandidate(
    { id: "act-1", user_id: ana.id, created_at: "2026-11-12T13:00:00.000Z", data: { blockType: "project", blockId: bAna.id } },
    bAna,
    ana
  );
  check("update a menos de 2 horas del alta se descarta", echo === null);
  check("helper de eco", isCreateEcho(bAna.created_at, "2026-11-12T13:30:00.000Z"));

  const realUpdate = updateCandidate(
    { id: "act-2", user_id: ana.id, created_at: "2026-11-13T12:00:00.000Z", data: { blockType: "project", blockId: bAna.id } },
    bAna,
    ana
  );
  check("update real usa el id del bloque", realUpdate?.sourceType === "update" && realUpdate.sourceId === bAna.id);

  const built = projectCandidate(bAna, { ...ana, email: "secreto@interno.test" } as PublicProfile & { email: string });
  const blob = JSON.stringify(built);
  check("el candidato no arrastra email ni insights", !!built && !blob.includes("secreto@interno.test") && !blob.includes("insights") && !blob.includes("visits"));
  check("titulo publico, sin inventar", built?.title === "Nave");
  check("sin descripcion privada", built?.description === "Sale hoy");
  if (built) {
    const dirtyTexts = buildCopy({
      sourceType: built.sourceType,
      name: built.name,
      title: built.title,
      description: built.description,
      url: built.url,
      xHandle: null,
      igHandle: null,
      founder: null,
    });
    const dirtyPayload = JSON.stringify(
      buildLogPayload(built, { texts: dirtyTexts, xHandle: "https://huevsite.io/ana", igHandle: null, founderRemaining: null })
    );
    check(
      "payload no copia email ni campos privados del bloque",
      !dirtyPayload.includes("secreto@interno.test") &&
        !dirtyPayload.includes("nope@interno.test") &&
        !dirtyPayload.includes("subscription_tier") &&
        !dirtyPayload.includes("builder_score") &&
        !dirtyPayload.includes("insights") &&
        !dirtyPayload.includes("visits")
    );
  }
}

// --- copy, handles, CTA, largo de X ---
{
  const urlMention = xHandleFromMention("https://huevsite.io/ana");
  check("una URL de resolveXHandles no es @", urlMention === null);
  const handle = xHandleFromMention("@ana_builds");
  check("un @ real se conserva", handle === "@ana_builds");

  check("instagram.com/handle", parseInstagramHandle("https://instagram.com/huevo") === "@huevo");
  check("permalink de instagram no es handle", parseInstagramHandle("https://instagram.com/p/abc") === null);
  check("perfil de huevsite no se vuelve @", parseInstagramHandle("https://huevsite.io/ana") === null);

  const base = {
    sourceType: "launch" as const,
    name: "Ana",
    title: "Nave",
    description: "Sale hoy",
    url: "https://huevsite.io/feed?launch=11111111-1111-1111-1111-111111111111&week=2026-W46",
    xHandle: "https://huevsite.io/ana",
    igHandle: null as string | null,
    founder: null,
  };
  const noAt = buildCopy(base);
  check("X sin @ si el mention es una URL", !noAt.x.includes("@"));
  check("LinkedIn no usa @", !noAt.linkedin.includes("@"));
  const withAt = buildCopy({ ...base, xHandle: "@ana_builds", igHandle: "@ana.ig" });
  check("X menciona el handle real", withAt.x.includes("(@ana_builds)"));
  check("IG usa el handle de Instagram, no el de X", withAt.instagram.includes("(@ana.ig)") && !withAt.instagram.includes("@ana_builds"));
  check("LinkedIn ignora los dos handles", !withAt.linkedin.includes("@"));
  check("hashtags solo en X e IG", noAt.x.includes("#buildinpublic") && noAt.instagram.includes("#BuildeaEnPublico") && !noAt.linkedin.includes("#"));

  const friday = buildCopy({ ...base, xHandle: "@ana_builds", founder: { remaining: 4, runDate: RUN_DATE } });
  check("CTA el viernes con remaining real", friday.founderCta && friday.x.includes("Quedan 4 lugares."));
  check("utm de X", friday.x.includes("utm_source=x") && friday.x.includes(`utm_content=${RUN_DATE}`));
  check("utm de instagram y linkedin", friday.instagram.includes("utm_source=instagram") && friday.linkedin.includes("utm_source=linkedin"));
  check("X entra en 280 con CTA", xWeightedLength(friday.x) <= 280);

  const long = buildCopy({ ...base, title: "A".repeat(400), xHandle: "@ana_builds", founder: { remaining: 4, runDate: RUN_DATE } });
  check("titulo largo se recorta y X sigue en 280", xWeightedLength(long.x) <= 280 && long.x.includes("…"));

  const soldOut = buildCopy({ ...base, founder: { remaining: 0, runDate: RUN_DATE } });
  const unreadable = buildCopy({ ...base, founder: { remaining: -1, runDate: RUN_DATE } });
  check("remaining 0 o -1 no agrega CTA", !soldOut.founderCta && !soldOut.x.includes("Founder") && !unreadable.x.includes("Founder"));

  check("viernes 14:00 UTC es viernes ART", isArtFriday(NOW));
  check("sabado 02:00 UTC sigue siendo viernes ART", isArtFriday(new Date("2026-11-14T02:00:00.000Z")));
  check("sabado 03:00 UTC ya es sabado ART", !isArtFriday(new Date("2026-11-14T03:00:00.000Z")));
  check("lunes no es viernes", !isArtFriday(new Date("2026-11-09T14:00:00.000Z")));

  const payload = buildLogPayload(
    {
      ...candidate({ sourceType: "new_project", sourceId: bAna.id, userId: ana.id }),
      title: "Nave",
      description: "Sale hoy",
    },
    { texts: noAt, xHandle: "https://huevsite.io/ana", igHandle: null, founderRemaining: null }
  );
  const payloadBlob = JSON.stringify(payload);
  check(
    "payload sin email ni campos privados",
    !payloadBlob.includes("email") &&
      !payloadBlob.includes("subscription_tier") &&
      !payloadBlob.includes("builder_score") &&
      !payloadBlob.includes("insights") &&
      !payloadBlob.includes("visits") &&
      !payloadBlob.includes("secreto@interno.test")
  );
}

// --- buffer response, sin red ---
{
  const ok = parseBufferCreateBody({ data: { createPost: { post: { id: "post-1" } } } });
  check("buffer success devuelve el id", ok.ok === true && ok.id === "post-1");
  const mutationError = parseBufferCreateBody({ data: { createPost: { message: "channel disconnected" } } });
  check("buffer MutationError no se toma como publicado", !mutationError.ok);
  const gql = parseBufferCreateBody({ errors: [{ message: "nope" }] });
  check("buffer graphql error no se toma como publicado", !gql.ok);
}

// --- corrida con store y publishers falsos ---
function memoryPublishers(overrides: Partial<AvancesPublishers> = {}) {
  const calls = { tweet: 0, linkedin: 0, instagram: 0, image: 0, seats: 0, mention: 0 };
  const publishers: AvancesPublishers = {
    xConfigured: true,
    linkedinConfigured: true,
    instagramConfigured: true,
    async resolveXMention() {
      calls.mention++;
      return "https://huevsite.io/ana";
    },
    async sendTweet(): Promise<ChannelAttempt> {
      calls.tweet++;
      return { status: "posted", id: "tw-1" };
    },
    async postLinkedIn(): Promise<ChannelAttempt> {
      calls.linkedin++;
      return { status: "posted", id: "li-1" };
    },
    async postInstagram(): Promise<ChannelAttempt> {
      calls.instagram++;
      return { status: "posted", id: "ig-1" };
    },
    async imageReachable() {
      calls.image++;
      return true;
    },
    async founderRemaining() {
      calls.seats++;
      return 4;
    },
    ...overrides,
  };
  return { publishers, calls };
}

function memoryStore(candidates: AvanceCandidate[], posted: PostedLog[] = []) {
  const logs: AvancesLogInsert[] = [];
  let current = posted.slice();
  const store: AvancesStore = {
    async loadCandidates() {
      return candidates;
    },
    async loadPosted() {
      return current;
    },
    async socialLinks() {
      return [{ platform: "instagram", url: "https://instagram.com/ana.ig" }, { platform: "twitter", url: "https://huevsite.io/no" }];
    },
    async insertLog(row) {
      logs.push(row);
      if (row.status === "posted") {
        current = current.concat({
          userId: row.userId,
          sourceType: row.sourceType,
          sourceId: row.sourceId,
          publishedAt: row.publishedAt,
          runDate: row.runDate,
          status: "posted",
        });
      }
      return { ok: true };
    },
  };
  return { store, logs, reads: () => current };
}

const livePick = candidate({
  sourceType: "launch",
  sourceId: "launch-live",
  userId: ana.id,
  username: "ana",
  name: "Ana",
  title: "Nave",
  url: "https://huevsite.io/feed?launch=launch-live&week=2026-W46",
  imageUrl: "https://huevsite.io/api/og/launch/launch-live",
  at: "2026-11-12T15:00:00.000Z",
});

async function main() {
  {
    const pub = memoryPublishers();
    const mem = memoryStore([livePick]);
    let loaded = 0;
    const store: AvancesStore = {
      ...mem.store,
      async loadCandidates(since) {
        loaded++;
        return mem.store.loadCandidates(since);
      },
    };
    const disabled = await runAvancesBuilders({
      now: NOW,
      dryRun: false,
      force: false,
      enabled: false,
      store,
      publishers: pub.publishers,
    });
    check("kill switch no publica", disabled.skipped && disabled.reason === "disabled");
    check("kill switch no toca store ni publishers", loaded === 0 && pub.calls.tweet === 0 && pub.calls.linkedin === 0 && pub.calls.instagram === 0);
  }

  {
    const pub = memoryPublishers();
    const mem = memoryStore([livePick]);
    const preview = await runAvancesBuilders({
      now: NOW,
      dryRun: true,
      force: false,
      enabled: false,
      store: mem.store,
      publishers: pub.publishers,
    });
    check("dry-run devuelve textos sin publicar", preview.skipped === false && !!preview.texts?.x && preview.founderCta);
    check("dry-run no llama a X, LinkedIn ni Instagram", pub.calls.tweet === 0 && pub.calls.linkedin === 0 && pub.calls.instagram === 0 && pub.calls.image === 0);
    check("dry-run loguea preview", mem.logs[0]?.status === "preview");
    check("preview no incluye @ inventado", !preview.texts?.x.includes("@ana"));
    check("preview de IG si menciona el handle de instagram", !!preview.texts?.instagram.includes("(@ana.ig)"));
  }

  {
    const pub = memoryPublishers();
    const mem = memoryStore([]);
    const empty = await runAvancesBuilders({
      now: NOW,
      dryRun: false,
      force: false,
      enabled: true,
      store: mem.store,
      publishers: pub.publishers,
    });
    check("no_signal no publica", empty.skipped && empty.reason === "no_signal" && pub.calls.tweet === 0);
    check("no_signal queda en el log", mem.logs[0]?.status === "skipped" && mem.logs[0]?.skipReason === "no_signal");
  }

  {
    const pub = memoryPublishers({
      linkedinConfigured: false,
      instagramConfigured: false,
    });
    const other = candidate({
      sourceType: "new_project",
      sourceId: "block-other",
      userId: "user-other",
      username: "leo",
      name: "Leo",
      title: "Otro",
      url: "https://huevsite.io/leo",
      imageUrl: "https://huevsite.io/api/og/leo",
      at: "2026-11-12T12:00:00.000Z",
    });
    const mem = memoryStore([livePick, other]);
    const live = await runAvancesBuilders({
      now: NOW,
      dryRun: false,
      force: false,
      enabled: true,
      store: mem.store,
      publishers: pub.publishers,
    });
    check("X publica y los canales sin config se saltean", live.results?.x === "posted:tw-1" && live.results?.linkedin === "skipped_no_config" && live.results?.instagram === "skipped_no_config");
    check("LinkedIn e IG sin config no se llaman", pub.calls.linkedin === 0 && pub.calls.instagram === 0 && pub.calls.tweet === 1);
    check("log posted con el id de X", mem.logs[0]?.status === "posted" && mem.logs[0]?.xResult === "posted:tw-1");

    const againPub = memoryPublishers();
    const again = await runAvancesBuilders({
      now: NOW,
      dryRun: false,
      force: false,
      enabled: true,
      store: mem.store,
      publishers: againPub.publishers,
    });
    check("segunda corrida del mismo dia se saltea", again.skipped && again.reason === "already_ran" && againPub.calls.tweet === 0);

    const forcedPub = memoryPublishers();
    const forced = await runAvancesBuilders({
      now: NOW,
      dryRun: false,
      force: true,
      enabled: true,
      store: mem.store,
      publishers: forcedPub.publishers,
    });
    check(
      "force=1 no saltea la segunda corrida",
      forced.skipped === false && forcedPub.calls.tweet === 1 && forced.pick?.sourceId === "block-other"
    );
  }

  {
    const pub = memoryPublishers({
      async imageReachable() {
        pub.calls.image++;
        return false;
      },
      async postLinkedIn() {
        pub.calls.linkedin++;
        return { status: "error", message: "typefully is gone" };
      },
    });
    const mem = memoryStore([{ ...livePick, at: "2026-11-10T12:00:00.000Z" }]);
    const partial = await runAvancesBuilders({
      now: new Date("2026-11-11T14:00:00.000Z"),
      dryRun: false,
      force: false,
      enabled: true,
      store: mem.store,
      publishers: pub.publishers,
    });
    check("un canal roto no frena a los otros", partial.results?.x === "posted:tw-1" && partial.results?.linkedin.startsWith("error:") && partial.results?.instagram === "skipped_image");
    check("IG sin imagen no llama a Buffer", pub.calls.instagram === 0 && pub.calls.image === 1);
    check("miercoles no pide cupo Founder", pub.calls.seats === 0 && partial.founderCta === false);
  }

  {
    const savedCron = process.env.CRON_SECRET;
    const savedAdmin = process.env.ADMIN_SECRET;
    process.env.CRON_SECRET = "cron-test-value";
    process.env.ADMIN_SECRET = "admin-test-value";
    check("bearer de cron autoriza", isAvancesAuthorized("Bearer cron-test-value", null));
    check("secret manual autoriza", isAvancesAuthorized(null, "admin-test-value"));
    check("sin secreto no autoriza", !isAvancesAuthorized("Bearer no", "no"));
    if (savedCron === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = savedCron;
    if (savedAdmin === undefined) delete process.env.ADMIN_SECRET;
    else process.env.ADMIN_SECRET = savedAdmin;
  }

  check("enabled solo si es true", isAvancesEnabled("true") && !isAvancesEnabled("false") && !isAvancesEnabled(undefined));
  check("dry-run por preview, query o env", isAvancesDryRun({ preview: "1", dryRun: null, env: undefined }) && isAvancesDryRun({ preview: null, dryRun: "1", env: undefined }) && isAvancesDryRun({ preview: null, dryRun: null, env: "true" }));
  check("sin flag no es dry-run", !isAvancesDryRun({ preview: null, dryRun: "0", env: "false" }));

  if (failed > 0) {
    console.error(`\n${failed} checks failed`);
    process.exit(1);
  }
  console.log("\navances-builders ok");
}

void main();
