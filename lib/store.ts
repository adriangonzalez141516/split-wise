import { Sala, Evento, UserGlobalWallet, RoomBalanceCalculation, LiquidacionTransaction, Member, TicketItem } from './types';
import { calculateMinCashFlow, identifySuggestedPayer } from './min-cash-flow';

// Initial Seed Data aligning directly with Supabase remote database (cenas-viernes)
const initialSeedSalas: Sala[] = [
  {
    id: 'cenas-viernes',
    name: 'Cenas de los Viernes',
    description: 'Grupo gastronómico semanal y cañas de fin de semana',
    icon: 'restaurant',
    debtThreshold: -50.0,
    boteComun: 45.0,
    pass: {
      type: 'pase_sala',
      status: 'activo',
      eventsUsed: 3,
      maxEvents: 20,
      purchasedByMemberId: 'm1',
      expiresAt: '2026-12-31',
    },
    members: [
      {
        id: 'm1',
        name: 'Carlos M. (Tú)',
        phone: '+34 600 112 233',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isVirtual: false,
      },
      {
        id: 'm2',
        name: 'Mateo R.',
        phone: '+34 611 223 344',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        isVirtual: false,
      },
      {
        id: 'm3',
        name: 'Sofía L.',
        phone: '+34 622 334 455',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        isVirtual: false,
      },
      {
        id: 'm4',
        name: 'Elena V. (Invitada)',
        phone: '+34 633 445 566',
        avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
        isVirtual: true,
        claimToken: 'token-elena-4455',
      },
      {
        id: 'm5',
        name: 'Lucas B.',
        phone: '+34 644 556 677',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        isVirtual: false,
      },
    ],
    createdAt: '2026-01-10T19:00:00Z',
    lastActivityAt: '2026-09-15T12:00:00Z',
    eventos: [
      {
        id: 'taberna-ilustres',
        salaId: 'cenas-viernes',
        title: 'Cena Gourmet Los Ilustres',
        venue: 'Taberna Los Ilustres',
        table: 'Mesa 14',
        date: '2026-09-15',
        status: 'en_curso',
        originalPayerId: 'm2',
        suggestedPayerId: 'm2',
        items: [
          {
            id: 'item_1',
            name: 'Chuletón de Vaca Madurada (1kg)',
            quantity: 1,
            unit_price: 68.0,
            total_price: 68.0,
            category: 'food',
            assignedMemberIds: ['m1', 'm2', 'm5'],
          },
          {
            id: 'item_2',
            name: 'Vino Ribera del Duero Reserva',
            quantity: 2,
            unit_price: 24.0,
            total_price: 48.0,
            category: 'alcohol',
            assignedMemberIds: ['m1', 'm2'],
          },
          {
            id: 'item_3',
            name: 'Croquetas de Jamón Ibérico (8ud)',
            quantity: 2,
            unit_price: 12.0,
            total_price: 24.0,
            category: 'food',
            assignedMemberIds: ['m1', 'm2', 'm3', 'm4', 'm5'],
          },
          {
            id: 'item_4',
            name: 'Tarta de Queso Idiazábal Fluida',
            quantity: 3,
            unit_price: 7.5,
            total_price: 22.5,
            category: 'dessert',
            assignedMemberIds: ['m3', 'm4', 'm5'],
          },
          {
            id: 'item_5',
            name: 'Aguas Minerales & Cafés Solo',
            quantity: 4,
            unit_price: 3.0,
            total_price: 12.0,
            category: 'standard_drink',
            assignedMemberIds: ['m1', 'm2', 'm3', 'm4'],
          },
        ],
        commonCosts: [],
        globalModifiers: {},
        totalAmount: 184.5,
        transactions: [],
      },
    ],
  },
];

// Persistent global across hot-reloads and worker processes
declare global {
  // eslint-disable-next-line no-var
  var __stitch_salas_store__: Sala[] | undefined;
}

globalThis.__stitch_salas_store__ = initialSeedSalas;

const salasStore: Sala[] = globalThis.__stitch_salas_store__;

// Current logged in user ID (m1 in Supabase seed, mapped to Carlos)
export const CURRENT_USER_ID = 'm1';

// Get all rooms
export function getSalas(): Sala[] {
  return salasStore;
}

// Get room by ID
export function getSalaById(id: string): Sala | undefined {
  return salasStore.find((s) => s.id === id);
}

// Get event by ID
export function getEventoById(salaId: string, eventoId: string): Evento | undefined {
  const sala = getSalaById(salaId);
  if (sala) {
    const ev = sala.eventos.find((e) => e.id === eventoId);
    if (ev) return ev;
  }
  // Fallback: search across all rooms
  for (const s of salasStore) {
    const ev = s.eventos.find((e) => e.id === eventoId);
    if (ev) return ev;
  }
  return undefined;
}

/**
 * Operative Room Balance Calculation Formula:
 * B_s = \sum P_{adv} - \sum C_{pers} + \sum T_{rec} - \sum T_{env}
 * Con principio de conservación: \sum_{m} B_s(m) = 0.00 €
 */
export function calculateRoomBalance(salaOrId: string | Sala, memberId: string): RoomBalanceCalculation {
  const sala = typeof salaOrId === 'string' ? getSalaById(salaOrId) : salaOrId;
  if (!sala) {
    return { memberId, pAdv: 0, cPers: 0, tRec: 0, tEnv: 0, netBalance: 0 };
  }

  // Resolver ID efectivo de Carlos/usuario para compatibilidad Supabase ('m1') vs local ('user-carlos')
  const effectiveMember = sala.members.find(
    (m) =>
      m.id === memberId ||
      (memberId.toLowerCase().includes('carlos') &&
        (m.id === 'm1' || m.id === 'user-carlos' || m.id === 'user_carlos_1' || m.name.toLowerCase().includes('carlos')))
  );
  const targetId = effectiveMember ? effectiveMember.id : memberId;

  let pAdv = 0;
  let cPers = 0;
  let tRec = 0;
  let tEnv = 0;

  for (const evento of sala.eventos || []) {
    // 1. Pagos adelantados (si el usuario fue el pagador de la cuenta)
    if (evento.originalPayerId === targetId) {
      pAdv += Number(evento.totalAmount || 0);
    }

    // 2. Consumo personal en los platos asignados
    const activeMemberCount = (sala.members || []).length;
    for (const item of evento.items || []) {
      const assigned = item.assignedMemberIds || [];
      if (assigned.includes(targetId) || (targetId === 'm1' && assigned.includes('user-carlos')) || (targetId === 'user-carlos' && assigned.includes('m1'))) {
        const count = assigned.length || 1;
        cPers += Number(item.total_price || 0) / count;
      }
    }

    // Costes comunes
    for (const cc of evento.commonCosts || []) {
      cPers += Number(cc.amount || 0) / (activeMemberCount || 1);
    }

    // 3. Bizums o transferencias de liquidación consolidadas
    for (const tx of evento.transactions || []) {
      if (tx.status === 'consolidado') {
        if (tx.toMemberId === targetId) {
          tRec += Number(tx.amount || 0);
        }
        if (tx.fromMemberId === targetId) {
          tEnv += Number(tx.amount || 0);
        }
      }
    }
  }

  pAdv = Math.round(pAdv * 100) / 100;
  cPers = Math.round(cPers * 100) / 100;
  tRec = Math.round(tRec * 100) / 100;
  tEnv = Math.round(tEnv * 100) / 100;
  const netBalance = Math.round((pAdv - cPers + tRec - tEnv) * 100) / 100;

  return { memberId: targetId, pAdv, cPers, tRec, tEnv, netBalance };
}

/**
 * Informative Global Wallet Calculation:
 * Applies Non-Compensation Principle across independent rooms:
 * Total por cobrar = \sum \max(0, B_s)
 * Total por pagar = \sum |\min(0, B_s)|
 * Net Balance Total = Total por cobrar - Total por pagar
 */
export function calculateUserGlobalWallet(userId: string = CURRENT_USER_ID, customSalas?: Sala[]): UserGlobalWallet {
  const salas = customSalas || getSalas();
  let totalPorCobrar = 0;
  let totalPorPagar = 0;

  for (const sala of salas) {
    const member = sala.members.find(
      (m) =>
        m.id === userId ||
        (userId.toLowerCase().includes('carlos') &&
          (m.id === 'm1' || m.id === 'user-carlos' || m.id === 'user_carlos_1' || m.name.toLowerCase().includes('carlos')))
    );

    if (member) {
      const calc = calculateRoomBalance(sala, member.id);
      if (calc.netBalance > 0) {
        totalPorCobrar += calc.netBalance;
      } else if (calc.netBalance < 0) {
        totalPorPagar += Math.abs(calc.netBalance);
      }
    }
  }

  totalPorCobrar = Math.round(totalPorCobrar * 100) / 100;
  totalPorPagar = Math.round(totalPorPagar * 100) / 100;
  const netBalanceTotal = Math.round((totalPorCobrar - totalPorPagar) * 100) / 100;

  return {
    userId,
    userName: 'Carlos',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    totalPorCobrar,
    totalPorPagar,
    netBalanceTotal,
  };
}

/**
 * Mutation: Create a new room
 */
export function createSala(name: string, description: string, creatorId: string = CURRENT_USER_ID): Sala {
  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now().toString().slice(-4);
  const newSala: Sala = {
    id,
    name,
    description,
    icon: 'groups',
    debtThreshold: -50.0,
    boteComun: 0.0,
    pass: {
      type: 'pase_sala',
      status: 'activo',
      eventsUsed: 0,
      maxEvents: 20,
      purchasedByMemberId: creatorId,
    },
    members: [
      {
        id: creatorId,
        name: 'Carlos (Tú)',
        isVirtual: false,
      },
    ],
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    eventos: [],
  };

  salasStore.unshift(newSala);
  return newSala;
}

/**
 * Mutation: Add a virtual member to a room
 */
export function addVirtualMember(salaId: string, name: string): Member | undefined {
  const sala = getSalaById(salaId);
  if (!sala) return undefined;

  const id = `guest-${Date.now().toString().slice(-6)}`;
  const claimToken = `token-${Math.random().toString(36).substring(2, 8)}`;
  const virtualMember: Member = {
    id,
    name: `${name}*`,
    alias: `${name}*`,
    isVirtual: true,
    claimToken,
  };

  sala.members.push(virtualMember);
  return virtualMember;
}

/**
 * Mutation: Claim Account Token (Migrates virtual member to registered user)
 */
export function claimAccount(claimToken: string, newUserId: string, newUserName: string, newUserPhone?: string): boolean {
  for (const sala of salasStore) {
    const memberIndex = sala.members.findIndex((m) => m.claimToken === claimToken);
    if (memberIndex !== -1) {
      const oldId = sala.members[memberIndex].id;
      // Update member
      sala.members[memberIndex] = {
        id: newUserId,
        name: newUserName,
        phone: newUserPhone || sala.members[memberIndex].phone,
        isVirtual: false,
        registeredUserId: newUserId,
      };

      // Migrate item assignments in all events
      for (const evento of sala.eventos) {
        for (const item of evento.items) {
          const idx = item.assignedMemberIds.indexOf(oldId);
          if (idx !== -1) {
            item.assignedMemberIds[idx] = newUserId;
          }
        }
        for (const tx of evento.transactions) {
          if (tx.fromMemberId === oldId) tx.fromMemberId = newUserId;
          if (tx.toMemberId === oldId) tx.toMemberId = newUserId;
        }
      }
      return true;
    }
  }
  return false;
}

/**
 * Mutation: Toggle Item Claim for a Member
 */
export function toggleItemClaim(salaId: string, eventoId: string, itemId: string, memberId: string = CURRENT_USER_ID): boolean {
  const evento = getEventoById(salaId, eventoId);
  if (!evento) return false;

  const item = evento.items.find((i) => i.id === itemId);
  if (!item) return false;

  const idx = item.assignedMemberIds.indexOf(memberId);
  if (idx !== -1) {
    item.assignedMemberIds.splice(idx, 1);
  } else {
    item.assignedMemberIds.push(memberId);
  }
  return true;
}

/**
 * Mutation: Exclude alcohol for member
 */
export function excludeAlcoholForMember(salaId: string, eventoId: string, memberId: string = CURRENT_USER_ID, exclude: boolean = true): void {
  const evento = getEventoById(salaId, eventoId);
  if (!evento) return;

  for (const item of evento.items) {
    if (item.category === 'alcohol') {
      const idx = item.assignedMemberIds.indexOf(memberId);
      if (exclude && idx !== -1) {
        item.assignedMemberIds.splice(idx, 1);
      } else if (!exclude && idx === -1) {
        item.assignedMemberIds.push(memberId);
      }
    }
  }
}

/**
 * Mutation: Update Bizum Transaction Status
 */
export function updateTransactionStatus(salaId: string, eventoId: string, txId: string, newStatus: 'propuesta' | 'pendiente' | 'consolidado'): boolean {
  const evento = getEventoById(salaId, eventoId);
  if (!evento) return false;

  const tx = evento.transactions.find((t) => t.id === txId);
  if (!tx) return false;

  tx.status = newStatus;
  tx.updatedAt = new Date().toISOString();
  return true;
}

/**
 * Mutation: Add a new dish/item to an event
 */
export function addItemToEvento(
  salaId: string,
  eventoId: string,
  itemData: Omit<TicketItem, 'id'>
): TicketItem | undefined {
  const evento = getEventoById(salaId, eventoId);
  if (!evento) return undefined;

  const newItem: TicketItem = {
    ...itemData,
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    total_price: Math.round(itemData.quantity * itemData.unit_price * 100) / 100,
  };

  evento.items.push(newItem);
  evento.totalAmount = Math.round((evento.totalAmount + newItem.total_price) * 100) / 100;
  return newItem;
}

/**
 * Mutation: Add multiple items (from ticket scanning) to an event
 */
export function addMultipleItemsToEvento(
  salaId: string,
  eventoId: string,
  newItemsData: Omit<TicketItem, 'id'>[]
): TicketItem[] {
  const evento = getEventoById(salaId, eventoId);
  if (!evento) return [];

  const addedItems: TicketItem[] = [];
  let addedTotal = 0;

  for (const data of newItemsData) {
    const item: TicketItem = {
      ...data,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      total_price: Math.round(data.quantity * data.unit_price * 100) / 100,
    };
    evento.items.push(item);
    addedItems.push(item);
    addedTotal += item.total_price;
  }

  evento.totalAmount = Math.round((evento.totalAmount + addedTotal) * 100) / 100;
  return addedItems;
}

/**
 * Mutation: Create a new event in a room
 */
export function createEvento(
  salaId: string,
  eventData: {
    title: string;
    venue: string;
    table?: string;
    date?: string;
    originalPayerId?: string;
  }
): Evento | undefined {
  const sala = getSalaById(salaId);
  if (!sala) return undefined;

  const newEventoId = `evento-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const newEvento: Evento = {
    id: newEventoId,
    salaId,
    title: eventData.title || `Evento #${sala.eventos.length + 1}`,
    venue: eventData.venue || 'Restaurante',
    table: eventData.table || 'Mesa 1',
    date: eventData.date || new Date().toISOString().split('T')[0],
    status: 'en_curso',
    originalPayerId: eventData.originalPayerId || sala.members[0]?.id || CURRENT_USER_ID,
    suggestedPayerId: eventData.originalPayerId || sala.members[0]?.id || CURRENT_USER_ID,
    items: [],
    commonCosts: [],
    globalModifiers: {},
    totalAmount: 0,
    transactions: [],
  };

  sala.eventos.unshift(newEvento);
  sala.lastActivityAt = new Date().toISOString();
  if (sala.pass && sala.pass.eventsUsed !== undefined) {
    sala.pass.eventsUsed = Math.min(sala.pass.maxEvents, sala.pass.eventsUsed + 1);
  }

  return newEvento;
}

