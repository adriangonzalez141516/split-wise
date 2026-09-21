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
    // Sala Creada
    const adminMember = sala.members[0];
    const adminName = adminMember ? adminMember.name : 'Alguien';
    activities.push({
      id: `sala-${sala.id}`,
      type: 'evento',
      salaId: sala.id,
      salaName: sala.name,
      title: 'Nueva Sala',
      description: `Creó el grupo "${sala.name}"`,
      amount: 0,
      timestamp: sala.createdAt || new Date().toISOString(),
      actorId: adminMember ? adminMember.id : 'unknown',
      actorName: adminName,
    });

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
        description: `Añadió un nuevo evento por ${ev.totalAmount.toFixed(2)}€`,
        amount: ev.totalAmount,
        timestamp: ev.date || sala.createdAt || new Date().toISOString(),
        actorId: ev.originalPayerId || '',
        actorName: payerName,
      });

      // Procesar Platos (Items)
      for (const item of ev.items || []) {
        activities.push({
          id: `item-${item.id}`,
          type: 'evento',
          salaId: sala.id,
          salaName: sala.name,
          title: item.name,
          description: `Añadió "${item.name}" al evento ${ev.venue || ev.title}`,
          amount: item.total_price || (item.unit_price * item.quantity),
          timestamp: ev.date || sala.createdAt || new Date().toISOString(),
          actorId: ev.originalPayerId || '', // Asumimos que el creador del evento o pagador lo añade
          actorName: payerName,
        });
      }

      // Procesar Liquidaciones asociadas al evento
      for (const liq of ev.transactions || []) {
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
          timestamp: liq.updatedAt || liq.suggestedAt || new Date().toISOString(),
          actorId: liq.fromMemberId,
          actorName: fromName,
          isPositiveForMe,
        });
      }
    }
  }

  // Ordenar cronológicamente (más reciente primero)
  return activities.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
  });
}
