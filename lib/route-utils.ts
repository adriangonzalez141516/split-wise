export type RouteType = 'dashboard' | 'sala' | 'evento' | 'actividad' | 'perfil' | 'not_found';

export interface ParsedRoute {
  type: RouteType;
  salaId?: string;
  eventoId?: string;
  title: string;
  description: string;
}

/**
 * Parses Next.js catch-all slug array into high-level view targets and SEO metadata.
 */
export function parseRouteSlug(slug?: string[]): ParsedRoute {
  if (!slug || slug.length === 0) {
    return {
      type: 'dashboard',
      title: 'LaRonda — Salas y Gastos Compartidos',
      description: 'Plataforma colaborativa de gestión de gastos en tiempo real con IA y liquidación Min-Cash-Flow.',
    };
  }

  const [first, second, third, fourth] = slug;

  // /sala/[salaId]
  if (first === 'sala' && second && !third) {
    return {
      type: 'sala',
      salaId: second,
      title: `Detalle de Sala — LaRonda`,
      description: 'Consulta balances de sala, bote común, desglose de miembros y eventos.',
    };
  }

  // /sala/[salaId]/evento/[eventoId]
  if (first === 'sala' && second && third === 'evento' && fourth) {
    return {
      type: 'evento',
      salaId: second,
      eventoId: fourth,
      title: `Reparto en Mesa en Vivo — LaRonda`,
      description: 'Sesión inmersiva de reparto de cuenta en vivo, exclusión rápida de alcohol y liquidación Bizum optimizada.',
    };
  }

  // /evento/[eventoId] (convenience direct shortcut)
  if (first === 'evento' && second) {
    return {
      type: 'evento',
      salaId: 'cenas-viernes', // default fallback room
      eventoId: second,
      title: `Reparto en Mesa en Vivo — LaRonda`,
      description: 'Sesión inmersiva de reparto de cuenta en vivo con IA.',
    };
  }

  // /actividad
  if (first === 'actividad') {
    return {
      type: 'actividad',
      title: 'Historial y Actividad — LaRonda',
      description: 'Desglose de tickets pasados, comprobantes y exportaciones.',
    };
  }

  // /perfil
  if (first === 'perfil') {
    return {
      type: 'perfil',
      title: 'Tu Perfil y Monedero Global — LaRonda',
      description: 'Gestión de cuenta, suscripción de anfitrión y límites de riesgo.',
    };
  }

  return {
    type: 'not_found',
    title: 'Página no encontrada — LaRonda',
    description: 'La vista solicitada no existe o ha sido movida.',
  };
}
