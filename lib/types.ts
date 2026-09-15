export type ItemCategory = 'food' | 'standard_drink' | 'alcohol' | 'dessert' | 'service';

export interface TicketItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category: ItemCategory;
  assignedMemberIds: string[]; // Member IDs who share this item
}

export interface GlobalModifiers {
  tax_amount?: number;
  service_charge?: number;
  discount_amount?: number;
  tip_amount?: number;
}

export interface StructuredTicketOutput {
  establishment: string;
  date: string;
  currency: string;
  items: Omit<TicketItem, 'assignedMemberIds'>[];
  global_modifiers: GlobalModifiers;
  total_amount: number;
}

export interface Member {
  id: string;
  name: string;
  alias?: string;
  phone?: string;
  avatarUrl?: string;
  isVirtual: boolean; // Virtual Guest / Usuario Fantasma
  claimToken?: string; // Token for account claim
  registeredUserId?: string; // If claimed, maps to real user ID
}

export type BizumStatus = 'propuesta' | 'pendiente' | 'consolidado';

export interface LiquidacionTransaction {
  id: string;
  fromMemberId: string; // Debtor
  toMemberId: string; // Creditor
  amount: number;
  status: BizumStatus;
  suggestedAt: string;
  updatedAt: string;
  note?: string;
  ruleApplied: 'regla_1' | 'regla_2' | 'regla_3' | 'regla_4_min_cash_flow';
}

export interface Evento {
  id: string;
  salaId: string;
  title: string;
  venue: string;
  table?: string;
  date: string;
  status: 'en_curso' | 'cerrado';
  originalPayerId: string; // Original bill payer (Mateo / Carlos)
  items: TicketItem[];
  commonCosts: {
    name: string;
    amount: number;
    splitType: 'equitativo' | 'proporcional';
  }[];
  globalModifiers: GlobalModifiers;
  totalAmount: number;
  transactions: LiquidacionTransaction[];
  suggestedPayerId?: string; // Rule 1
}

export interface SalaPass {
  type: 'pase_sala' | 'pase_super_anfitrion';
  status: 'activo' | 'inactivo';
  eventsUsed: number;
  maxEvents: number; // 20 for pase_sala, unlimited for super_anfitrion
  purchasedByMemberId?: string;
  expiresAt?: string;
}

export interface Sala {
  id: string;
  name: string;
  description: string;
  icon?: string;
  debtThreshold: number; // Default -50.00 EUR
  boteComun: number; // Common pool EUR
  pass: SalaPass;
  members: Member[];
  eventos: Evento[];
  createdAt: string;
  lastActivityAt: string;
}

export interface UserGlobalWallet {
  userId: string;
  userName: string;
  avatarUrl: string;
  totalPorCobrar: number; // Sum of positive balances across rooms (No compensation)
  totalPorPagar: number; // Sum of negative balances across rooms (No compensation)
  netBalanceTotal: number; // Informative net
}

export interface RoomBalanceCalculation {
  memberId: string;
  pAdv: number; // Pagos adelantados por el usuario
  cPers: number; // Consumo personal
  tRec: number; // Bizums recibidos consolidados
  tEnv: number; // Bizums enviados consolidados
  netBalance: number; // B_s = P_adv - C_pers + T_rec - T_env
}
