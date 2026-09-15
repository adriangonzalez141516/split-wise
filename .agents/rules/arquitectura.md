---
trigger: always_on
---

app/
├── (auth)/                         # Grupo de ruta para limpieza (URLs: /login, /registro)
│   ├── login/
│   │   └── page.tsx                
│   └── registro/
│       └── page.tsx                
│
├── api/                            # Capa Backend estricta (Route Handlers)
│   ├── ai/
│   │   └── parse-ticket/route.ts   # Endpoint POST (Recibe WebP comprimido -> LLM)
│   └── webhooks/
│       └── stripe/route.ts         # Recepción de pagos asíncronos (Pases de Sala)
│
├── [[...slug]]/                    # El "Director de Orquesta" (Catch-all)
│   ├── page.tsx                    # Lógica de decisión de UI y Metadatos
│   └── layout.tsx                  # Layout para las vistas de la app (Navbar, Monederos)
│
├── actions/                        # Capa Backend de mutaciones (Server Actions)
│   ├── salas.actions.ts            # Lógica: crear sala, añadir miembros virtuales
│   ├── eventos.actions.ts          # Lógica: consolidar asignación de platos
│   └── liquidacion.actions.ts      # Lógica: algoritmo Min-Cash-Flow en BD
│
├── components/
│   └── views/                      # Componentes visuales independientes
│       ├── DashboardView.tsx       # UI: Monedero global y listado de salas
│       ├── SalaView.tsx            # UI: Detalle de sala, balances y eventos
│       └── EventoLiveView.tsx      # UI: Sesión inmersiva de reparto en mesa
│
├── lib/
│   └── route-utils.ts              # Función para procesar el array 'slug'
│
└── layout.tsx                      # Root Layout (Providers, fuentes, etc.)



Diferenciando claramente front de back y priorizando la eficiencia y el SEO