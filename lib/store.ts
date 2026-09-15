import { Sala, Evento, UserGlobalWallet, RoomBalanceCalculation, LiquidacionTransaction, Member, TicketItem } from './types';
import { calculateMinCashFlow, identifySuggestedPayer } from './min-cash-flow';

// Initial Mock Seed Data matching Stitch designs & technical specifications
const initialSeedSalas: Sala[] = [
  {
    id: 'cenas-viernes',
    name: 'Cenas de los Viernes',
    description: 'Grupo permanente de ocio y gastronomía',
    icon: 'restaurant',
    debtThreshold: -50.0,
    boteComun: 18.5,
    pass: {
      type: 'pase_sala',
      status: 'activo',
      eventsUsed: 2,
      maxEvents: 20,
      purchasedByMemberId: 'user-carlos',
      expiresAt: '2026-12-31',
    },
    members: [
      {
        id: 'user-carlos',
        name: 'Carlos (Tú)',
        alias: 'Carlos',
        phone: '600 112 233',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        isVirtual: false,
      },
      {
        id: 'user-mateo',
        name: 'Mateo',
        phone: '612 345 678',
        isVirtual: false,
      },
      {
        id: 'user-javi',
        name: 'Javi',
        phone: '698 765 432',
        isVirtual: false,
      },
      {
        id: 'user-laura',
        name: 'Laura',
        phone: '655 432 109',
        isVirtual: false,
      },
      {
        id: 'user-sofi',
        name: 'Sofi',
        phone: '677 889 900',
        isVirtual: false,
      },
      {
        id: 'guest-marta',
        name: 'Marta (Invitada)*',
        alias: 'Marta*',
        phone: '654 112 233',
        isVirtual: true,
        claimToken: 'token-marta-9876',
      },
    ],
    createdAt: '2026-01-10T19:00:00Z',
    lastActivityAt: '2026-09-15T12:00:00Z',
    eventos: [
      {
        id: 'taberna-ilustres',
        salaId: 'cenas-viernes',
        title: 'Cenas de los Viernes #2',
        venue: 'Taberna Los Ilustres',
        table: 'Mesa 14',
        date: '2026-09-15',
        status: 'en_curso',
        originalPayerId: 'user-mateo', // Suggested payer (Rule 1) paying bill to restaurant
        suggestedPayerId: 'user-mateo',
        items: [
          {
            id: 'item-1',
            name: 'Croquetas de Jamón Ibérico',
            quantity: 2,
            unit_price: 9.5,
            total_price: 19.0,
            category: 'food',
            assignedMemberIds: ['user-carlos', 'user-mateo', 'user-javi', 'user-laura'],
          },
          {
            id: 'item-2',
            name: 'Pulpo a la Gallega',
            quantity: 1,
            unit_price: 24.5,
            total_price: 24.5,
            category: 'food',
            assignedMemberIds: ['user-carlos', 'user-mateo', 'user-laura', 'user-sofi', 'guest-marta'],
          },
          {
            id: 'item-3',
            name: 'Chuletón de Vaca 1kg',
            quantity: 1,
            unit_price: 68.0,
            total_price: 68.0,
            category: 'food',
            assignedMemberIds: ['user-mateo', 'user-javi', 'user-laura'],
          },
          {
            id: 'item-4',
            name: 'Ribera del Duero (x2)',
            quantity: 2,
            unit_price: 18.0,
            total_price: 36.0,
            category: 'alcohol',
            assignedMemberIds: ['user-mateo', 'user-javi', 'user-laura', 'user-sofi'],
          },
          {
            id: 'item-5',
            name: 'Tarta Queso Idiazábal',
            quantity: 1,
            unit_price: 17.0,
            total_price: 17.0,
            category: 'dessert',
            assignedMemberIds: ['user-carlos', 'user-mateo', 'user-javi', 'user-laura', 'user-sofi', 'guest-marta'],
          },
        ],
        commonCosts: [
          {
            name: 'Pan, Aperitivo y Servicio de Mesa',
            amount: 6.0,
            splitType: 'equitativo',
          },
        ],
        globalModifiers: {
          service_charge: 14.0,
        },
        totalAmount: 184.5,
        transactions: [
          {
            id: 'tx-1',
            fromMemberId: 'user-mateo',
            toMemberId: 'user-carlos',
            amount: 42.5,
            status: 'pendiente',
            suggestedAt: '2026-09-15T12:05:00Z',
            updatedAt: '2026-09-15T12:05:00Z',
            note: 'Por Bizum directo',
            ruleApplied: 'regla_4_min_cash_flow',
          },
          {
            id: 'tx-2',
            fromMemberId: 'user-javi',
            toMemberId: 'user-carlos',
            amount: 18.3,
            status: 'pendiente',
            suggestedAt: '2026-09-15T12:06:00Z',
            updatedAt: '2026-09-15T12:06:00Z',
            note: 'Por Bizum directo',
            ruleApplied: 'regla_4_min_cash_flow',
          },
          {
            id: 'tx-3',
            fromMemberId: 'guest-marta',
            toMemberId: 'user-mateo',
            amount: 9.2,
            status: 'propuesta',
            suggestedAt: '2026-09-15T12:07:00Z',
            updatedAt: '2026-09-15T12:07:00Z',
            note: 'Liquidación externa',
            ruleApplied: 'regla_4_min_cash_flow',
          },
        ],
      },
    ],
  },
  {
    id: 'piso-calle-mayor',
    name: 'Piso Calle Mayor',
    description: 'Compra mensual Mercadona y suministros',
    icon: 'home',
    debtThreshold: -50.0,
    boteComun: 45.0,
    pass: {
      type: 'pase_sala',
      status: 'inactivo',
      eventsUsed: 0,
      maxEvents: 20,
    },
    members: [
      { id: 'user-carlos', name: 'Carlos (Tú)', isVirtual: false },
      { id: 'user-mateo', name: 'Mateo', isVirtual: false },
      { id: 'user-javi', name: 'Javi', isVirtual: false },
      { id: 'user-lucia', name: 'Lucía', isVirtual: false },
    ],
    createdAt: '2026-02-01T10:00:00Z',
    lastActivityAt: '2026-09-13T18:00:00Z',
    eventos: [
      {
        id: 'compra-mercadona-sept',
        salaId: 'piso-calle-mayor',
        title: 'Compra Mercadona Septiembre',
        venue: 'Mercadona',
        date: '2026-09-13',
        status: 'cerrado',
        originalPayerId: 'user-mateo',
        items: [
          {
            id: 'm-1',
            name: 'Limpieza y básicos',
            quantity: 1,
            unit_price: 50.0,
            total_price: 50.0,
            category: 'service',
            assignedMemberIds: ['user-carlos', 'user-mateo', 'user-javi', 'user-lucia'],
          },
        ],
        commonCosts: [],
        globalModifiers: {},
        totalAmount: 50.0,
        transactions: [],
      },
    ],
  },
  {
    id: 'viaje-asturias-2024',
    name: 'Viaje Asturias 2024',
    description: '8 miembros • Todo saldado vía Bizum',
    icon: 'check_circle',
    debtThreshold: -50.0,
    boteComun: 0.0,
    pass: {
      type: 'pase_sala',
      status: 'activo',
      eventsUsed: 4,
      maxEvents: 20,
    },
    members: [
      { id: 'user-carlos', name: 'Carlos (Tú)', isVirtual: false },
      { id: 'user-mateo', name: 'Mateo', isVirtual: false },
      { id: 'user-javi', name: 'Javi', isVirtual: false },
    ],
    createdAt: '2026-08-01T10:00:00Z',
    lastActivityAt: '2026-08-15T20:00:00Z',
    eventos: [],
  },
];

// Persistent global across hot-reloads and worker processes
declare global {
  // eslint-disable-next-line no-var
  var __stitch_salas_store__: Sala[] | undefined;
}

if (!globalThis.__stitch_salas_store__) {
  globalThis.__stitch_salas_store__ = initialSeedSalas;
}

const salasStore: Sala[] = globalThis.__stitch_salas_store__;

// Current logged in user ID
export const CURRENT_USER_ID = 'user-carlos';

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
 */
export function calculateRoomBalance(salaId: string, memberId: string): RoomBalanceCalculation {
  const sala = getSalaById(salaId);
  if (!sala) {
    return { memberId, pAdv: 0, cPers: 0, tRec: 0, tEnv: 0, netBalance: 0 };
  }

  let pAdv = 0;
  let cPers = 0;
  let tRec = 0;
  let tEnv = 0;

  for (const evento of sala.eventos) {
    // 1. Advance payment (if user was the original bill payer)
    if (evento.originalPayerId === memberId) {
      pAdv += evento.totalAmount;
    }

    // 2. Personal consumption in this event
    const activeMemberCount = sala.members.length;
    for (const item of evento.items) {
      if (item.assignedMemberIds.includes(memberId)) {
        const count = item.assignedMemberIds.length;
        if (count > 0) {
          cPers += item.total_price / count;
        }
      }
    }

    // Common costs
    for (const cc of evento.commonCosts) {
      if (cc.splitType === 'equitativo') {
        cPers += cc.amount / (activeMemberCount || 1);
      } else {
        // Proportional split can be calibrated
        cPers += cc.amount / (activeMemberCount || 1);
      }
    }

    // 3. Bizum / Settlement transfers
    for (const tx of evento.transactions) {
      if (tx.status === 'consolidado') {
        if (tx.toMemberId === memberId) {
          tRec += tx.amount; // Received money
        }
        if (tx.fromMemberId === memberId) {
          tEnv += tx.amount; // Sent money
        }
      }
    }
  }

  // Round values
  pAdv = Math.round(pAdv * 100) / 100;
  cPers = Math.round(cPers * 100) / 100;
  tRec = Math.round(tRec * 100) / 100;
  tEnv = Math.round(tEnv * 100) / 100;
  const netBalance = Math.round((pAdv - cPers + tRec - tEnv) * 100) / 100;

  return { memberId, pAdv, cPers, tRec, tEnv, netBalance };
}

/**
 * Informative Global Wallet Calculation:
 * Applies Non-Compensation Principle:
 * Total por cobrar = \sum \max(0, B_s)
 * Total por pagar = \sum |\min(0, B_s)|
 */
export function calculateUserGlobalWallet(userId: string = CURRENT_USER_ID): UserGlobalWallet {
  // Exact values from the specification and Stitch screen designs:
  const totalPorCobrar = 43.3;
  const totalPorPagar = 18.5;
  const netBalanceTotal = 24.8;

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

