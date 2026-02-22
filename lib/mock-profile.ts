import { ProfileData } from "./profile-types";

export const MOCK_PROFILE: ProfileData = {
  username: "toms",
  displayName: "Tomás",
  accentColor: "#C8FF00",
  blocks: [
    {
      id: "hero-1",
      type: "hero",
      order: 0,
      col_span: 2,
      row_span: 2,
      visible: true,
      name: "Tomás Deluca",
      avatarUrl: "https://github.com/tomasdeluca.png",
      tagline: "Building stuff for builders at huevsite.io.",
      roles: ["developer", "founder"],
      status: "Buildando en público",
      location: "Buenos Aires, AR",
    },
    {
      id: "building-1",
      type: "building",
      order: 1,
      col_span: 1,
      row_span: 2,
      visible: true,
      project: "huevsite.io",
      description: "La red social para builders de LATAM que no sabías que necesitabas.",
      stack: ["Next.js", "TypeScript", "Tailwind"],
      link: "https://huevsite.io",
    },
    {
      id: "github-1",
      type: "github",
      order: 2,
      col_span: 1,
      row_span: 2,
      visible: true,
      username: "tomasdeluca",
      stats: {
        stars: 1240,
        repos: 42,
        followers: 850,
      },
    },
    {
      id: "project-1",
      type: "project",
      order: 3,
      col_span: 1,
      row_span: 2,
      visible: true,
      title: "ArgCampers",
      description: "Marketplace de alquiler de motorhomes en Argentina.",
      imageUrl: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=800&q=80",
      metrics: "500k USD GMV",
      link: "https://argcampers.com",
    },
    {
      id: "metric-1",
      type: "metric",
      order: 4,
      col_span: 1,
      row_span: 1,
      visible: true,
      label: "Usuarios en espera",
      value: "2,450",
    },
    {
      id: "social-x",
      type: "social",
      order: 5,
      col_span: 1,
      row_span: 1,
      visible: true,
      links: [
        {
          platform: "twitter",
          url: "https://x.com/huevsite",
          label: "X / Twitter"
        }
      ]
    },
    {
      id: "stack-1",
      type: "stack",
      order: 6,
      col_span: 1,
      row_span: 2,
      visible: true,
      items: ["React", "Next.js", "TS", "Python", "Rust", "Prisma", "PostgreSQL", "Framer", "Redis"],
    },
    {
      id: "community-1",
      type: "community",
      order: 7,
      col_span: 1,
      row_span: 1,
      visible: true,
      name: "Ethereum Argentina",
    },
    {
      id: "writing-1",
      type: "writing",
      order: 8,
      col_span: 1,
      row_span: 2,
      visible: true,
      posts: [
        { title: "Por qué dejé Google por una startup", date: "22 Feb", link: "#" },
        { title: "El futuro de los portfolios bento", date: "15 Feb", link: "#" },
      ]
    }
  ],
};
