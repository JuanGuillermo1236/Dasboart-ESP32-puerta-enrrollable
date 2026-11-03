# CacaoCover: Tema de color

## Paleta base

| Color | Código | Uso |
|---|---|---|
| Verde lima claro | `#ecffb6` | Fondos y superficies claras, texto sobre fondo oscuro |
| Verde lima eléctrico | `#d6fb00` | Acento principal, botones primarios, valores destacados |
| Verde petróleo profundo | `#00545f` | Texto, fondo del tema oscuro, tarjetas oscuras |

## Fondos con degradado

- Degradados difuminados tipo *mesh gradient* que mezclan los tres colores.
- Textura sutil de grano (noise) encima de los fondos grandes.
- Las zonas claras fluyen del lima eléctrico al crema; las oscuras, hacia el verde petróleo.
- Animación lenta del degradado de fondo, apenas perceptible.

### Tema claro

- Fondo: degradado `#ecffb6` → `#d6fb00`, con toques difuminados de `#00545f`.
- Tarjetas: vidrio esmerilado semitransparente claro.
- Texto: `#00545f`.

### Tema oscuro

- Fondo: `#00545f`, con manchas difuminadas de `#d6fb00` y `#ecffb6`.
- Tarjetas: vidrio esmerilado semitransparente oscuro.
- Texto: `#ecffb6`.

## Formas y componentes

- Tarjetas con efecto vidrio (glassmorphism) y esquinas muy redondeadas.
- Círculos y formas orgánicas como elementos gráficos: gauges circulares e indicadores en esfera.
- Botones primarios en `#d6fb00` con texto `#00545f`.

## Reglas de contraste

- Texto sobre `#d6fb00` y `#ecffb6`: siempre `#00545f`.
- Texto sobre `#00545f`: siempre `#ecffb6`.
- Nunca usar `#d6fb00` como color de texto sobre fondo claro (casi no se lee).
- Números grandes y de alto contraste para que se vean bajo el sol.

## Colores de estado (semáforo)

Solo para estados y alertas, nunca como decoración:

| Estado | Uso |
|---|---|
| Verde | Normal, cubierta en posición correcta, conexión OK |
| Ámbar | Aviso: humedad alta, señal WiFi débil, voltaje bajando |
| Rojo | Crítico: atasco del motor, fallo de finales de carrera, lluvia con cubierta abierta |

Deben distinguirse con claridad de la paleta base. Como el verde de estado se parece al lima, acompáñalo siempre con un ícono o etiqueta de texto, no solo con color.

## Prompt corto para pegar en Claude Design

```
Usa esta paleta exacta: #ecffb6 (verde lima claro), #d6fb00 (verde lima eléctrico) y #00545f (verde petróleo profundo). Fondos con degradados difuminados tipo mesh gradient que mezclen los tres colores, con textura sutil de grano. Tema claro: degradado #ecffb6 → #d6fb00 con toques de #00545f. Tema oscuro: fondo #00545f con manchas difuminadas de #d6fb00 y #ecffb6. Tarjetas de vidrio esmerilado semitransparente con esquinas muy redondeadas y formas circulares. Texto sobre #d6fb00 y #ecffb6 en #00545f; texto sobre #00545f en #ecffb6; nunca #d6fb00 como texto sobre fondo claro. Colores semáforo (verde/ámbar/rojo) solo para estados y alertas, siempre con ícono o etiqueta además del color. Animación lenta del degradado de fondo.
```

## Ajustes útiles si queda muy cargado

- "Baja la intensidad de los degradados y sube el contraste de las tarjetas."
- "Reduce el grano al 50 %."
- "Usa el degradado solo en el fondo de la pestaña Resumen y deja las demás más sobrias."
