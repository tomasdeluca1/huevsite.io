export const STARTER_PROMPT = `Soy tu editor de huevsite. huevsite es tu perfil público de builder: bio, proyectos, links y stack.

Seguí este orden:
1. Llamá get_my_profile antes de proponer nada.
2. Si falta bio, proyectos, links, stack o ubicación, preguntame.
3. Proponé mejoras concretas, en corto.
4. Antes de pedirme el sí, llamá la escritura con dry_run: true y mostrame cómo quedaría.
5. No escribas hasta que yo diga que sí. Recién ahí repetí la llamada sin dry_run.
6. Al final, ofrecé publicar un avance con post_update.

No borres un proyecto si yo no lo confirmo.`;

export const PUBLISH_PROMPT = `Quiero publicar un avance de lo que estoy buildeando.
1. Llamá get_my_profile y list_my_projects.
2. Si no está claro qué avancé, preguntame.
3. Mostrame el texto y esperá mi ok.
4. Recién ahí llamá post_update. Si el proyecto tiene link http y lo lancé, preguntame si también lo anuncio con announce_launch.`;

export const MCP_INSTRUCTIONS = `huevsite es el perfil público de la persona que inició sesión. Solo podés leer y editar ese perfil.
Llamá get_my_profile primero. Si falta bio, proyectos, links o stack, preguntá.
Proponé los cambios y esperá un sí antes de escribir con update_profile, create_project o update_project.
update_profile, create_project, update_project, delete_project y post_update aceptan dry_run: true: corren las mismas validaciones, devuelven cómo quedaría y no guardan nada. Usalo para mostrar la vista previa antes de pedir el sí.
Después ofrecé post_update para un avance en público.
delete_project solo si te pasan confirm true. No mandes mails ni publiques en redes.
Si el cliente lista prompts, ofrecé armar_mi_perfil y publicar_avance.`;

export const CLIENT_GUIDES: Array<{ id: string; title: string; steps: string[] }> = [
  {
    id: "cursor",
    title: "Cursor",
    steps: [
      "Tocá Agregar a Cursor. Se abre la app.",
      "Cursor te pide instalar el servidor huevsite. Aceptá.",
      "La primera vez te abre el navegador. Entrá con tu cuenta de huevsite y tocá Permitir.",
      "Volvé al chat y pegá el prompt de arranque.",
    ],
  },
  {
    id: "vscode",
    title: "VS Code",
    steps: [
      "Tocá Agregar a VS Code. Se abre el instalador del servidor.",
      "Revisá el aviso de confianza y aceptá. Si pide entrar, usá tu cuenta de huevsite.",
      "Si el link no abre nada: Command Palette, Chat: Open Customizations, MCP Servers, Add Server.",
      "Elegí HTTP (HTTP or Server-Sent Events) y pegá la URL. El ID es huevsite.",
      "Elegí Global y después Copilot Global. Revisá el aviso y seguí el inicio de sesión.",
      "En el chat, pegá el prompt de arranque.",
    ],
  },
  {
    id: "claude",
    title: "Claude",
    steps: [
      "Entrá a Customize, después Connectors.",
      "Tocá Add. Elegí Add custom connector. Si ves Custom, elegí Web.",
      "Nombre: huevsite. En la URL pegá la de arriba. Seguí con Continue.",
      "En Authentication elegí Sign in now. En OAuth client dejá Use Claude's published identity, o Register automatically.",
      "Tocá Add y después Connect. Entrá con tu cuenta de huevsite y permití el acceso.",
      "En el chat, pegá el prompt de arranque.",
    ],
  },
  {
    id: "chatgpt",
    title: "ChatGPT",
    steps: [
      "En chatgpt.com abrí Plugins. No hace falta un modo desarrollador.",
      "Tocá el botón + y después Add custom MCP server.",
      "Nombre: huevsite. En Server URL pegá la de arriba. Authentication: OAuth.",
      "Aceptá I understand and want to continue.",
      "Tocá Create as a plugin e instalá el plugin.",
      "En el chat escribí @, elegí huevsite y pegá el prompt de arranque.",
    ],
  },
];
