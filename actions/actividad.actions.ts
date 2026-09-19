'use server';

import { getSalasAction } from '@/actions/salas.actions';

export interface ActivityItem {
  id: string;
  type: 'evento' | 'liquidacion';
  salaId: string;
  salaName: string;
  title: string;
  description: string;
  amount: number;
  timestamp: string;
  actorId: string;
  actorName: string;
  isPositiveForMe?: boolean;
}

export async function getActividadGlobalAction(currentUserId: string): Promise<ActivityItem[]> {
  const salas = await getSalasAction();
  const activities: ActivityItem[] = [];

  for (const sala of salas) {
    const isMember = sala.members.some(
      (m) => m.id === currentUserId || m.registeredUserId === currentUserId
    );
    if (!isMember && currentUserId !== 'm1' && currentUserId !== 'user-carlos') {
        // En entorno local o sin auth estricto, m1 y user-carlos suelen pasar. 
        // Si no somos miembros, saltamos (aunque getSalasAction ya suele filtrar por RLS).
        continue;
    }

    // Procesar Eventos
    for (const ev of sala.eventos || []) {
      const payer = sala.members.find((m) => m.id === ev.originalPayerId);
      const payerName = payer ? payer.name : 'Alguien';
      
      activities.push({
        id: `ev-${ev.id}`,
        type: 'evento',
        salaId: sala.id,
        salaName: sala.name,
        title: ev.title || ev.venue,
        description: `Añadió un nuevo ticket/evento de ${ev.totalAmount.toFixed(2)}€`,
        amount: ev.totalAmount,
        timestamp: ev.date || sala.createdAt, // fallback a creación de sala si falla
        actorId: ev.originalPayerId,
        actorName: payerName,
      });

      // Procesar Liquidaciones asociadas al evento
      for (const liq of ev.transactions || []) {
        // Solo mostrar liquidaciones si nos involucran directamente o si queremos ver todo?
        // En una app como Splitwise el feed global muestra TODO lo del grupo.
        const fromMember = sala.members.find((m) => m.id === liq.fromMemberId);
        const toMember = sala.members.find((m) => m.id === liq.toMemberId);
        
        const fromName = fromMember ? fromMember.name : 'Alguien';
        const toName = toMember ? toMember.name : 'Alguien';
        
        let desc = '';
        let isPositiveForMe = undefined;

        if (liq.status === 'consolidado') {
          desc = `Pagó ${liq.amount.toFixed(2)}€ a ${toName}`;
          if (liq.toMemberId === currentUserId) isPositiveForMe = true;
          if (liq.fromMemberId === currentUserId) isPositiveForMe = false;
        } else {
          desc = `Propone pagar ${liq.amount.toFixed(2)}€ a ${toName}`;
        }

        activities.push({
          id: `liq-${liq.id}`,
          type: 'liquidacion',
          salaId: sala.id,
          salaName: sala.name,
          title: 'Liquidación',
          description: desc,
          amount: liq.amount,
          timestamp: liq.updatedAt || liq.suggestedAt,
          actorId: liq.fromMemberId,
          actorName: fromName,
          isPositiveForMe,
        });
      }
    }
  }

  // Ordenar cronológicamente (más reciente primero)
  return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
