# AGENTS.md

Instrucciones para agentes de código (Cursor, Devin y otros) en este repo.

## Comandos

```bash
npm test
npx tsc --noEmit
npm run build
npm run verify
```

No hay script `lint`. No lo corras: no hay ESLint configurado y `next lint` abre un wizard interactivo.

## Flujo Superpowers

Seguí el método de [Superpowers](https://github.com/obra/superpowers).

- Antes de codear: brainstorming corto (si el pedido ya trae spec, solo confirmar) y writing-plans.
- La spec y el plan van en la descripción del PR.
- TDD rojo/verde: features con tests nuevos, fixes con el test que reproduce el bug.
- systematic-debugging para bugs.
- requesting-code-review: autorrevisión antes de pedir review.
- verification-before-completion: no marcar listo sin pegar evidencia (tests, typecheck, build, preview revisado).

## Worktree por agente

Cada agente trabaja en su propio worktree y en una rama `agente/<origen>/<slug>`. No trabajar en main. Sin force push.

## Review en la línea

Los hallazgos van como comentarios de review anclados al diff, en un solo lote. Nadie se autoaprueba.

## Merge y deploy

Merge y deploy solo con OK directo de Tomás. Nunca secretos ni datos de clientes en código, PRs o comentarios.
