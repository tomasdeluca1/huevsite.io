import messages from "@/messages/es.json";

export const STARTER_PROMPT = messages.mcpDocs.starterPrompt;
export const PUBLISH_PROMPT = messages.mcpDocs.publishPrompt;

export const MCP_INSTRUCTIONS = `huevsite es el perfil público de la persona que inició sesión. Solo podés leer y editar ese perfil.
Llamá get_my_profile primero. Si falta bio, proyectos, links o stack, preguntá.
Proponé los cambios y esperá un sí antes de escribir con update_profile, create_project o update_project.
profile_layout es portfolio (grilla) o links (bio con botones). El default es portfolio.
link_box_style es el formato global de esos botones: pill, card, compact, featured o expandable.
boxStyle en un proyecto pisa ese formato. null vuelve al global.
get_my_profile trae grid: los bloques del perfil con orden y tamaño, y grid.issues con lo que está desprolijo. Para acomodar la grilla usá arrange_blocks: tidy true arregla duplicados, huecos y orden; blocks mueve o redimensiona bloques puntuales. Después de crear bloques, ofrecé arrange_blocks tidy.
image_focus en update_profile encuadra la foto de perfil (x, y de 0 a 100; zoom de 1 a 3).
update_profile, create_project, update_project, delete_project, post_update y arrange_blocks aceptan dry_run: true: corren las mismas validaciones, devuelven cómo quedaría y no guardan nada. Usalo para mostrar la vista previa antes de pedir el sí.
Después ofrecé post_update para un avance en público.
delete_project solo si te pasan confirm true. No mandes mails ni publiques en redes.
Si el cliente lista prompts, ofrecé armar_mi_perfil y publicar_avance.`;
