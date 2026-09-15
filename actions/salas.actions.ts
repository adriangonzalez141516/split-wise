'use server';

import { revalidatePath } from 'next/cache';
import {
  getSalas,
  getSalaById,
  createSala,
  addVirtualMember,
  claimAccount,
  calculateRoomBalance,
  CURRENT_USER_ID,
} from '@/lib/store';
import { Sala, Member } from '@/lib/types';

export async function getSalasAction(): Promise<Sala[]> {
  return getSalas();
}

export async function getSalaDetailAction(salaId: string): Promise<Sala | null> {
  const sala = getSalaById(salaId);
  return sala || null;
}

export async function crearSalaAction(name: string, description: string): Promise<Sala> {
  const sala = createSala(name, description, CURRENT_USER_ID);
  revalidatePath('/');
  return sala;
}

export async function anadirMiembroVirtualAction(salaId: string, name: string): Promise<Member | null> {
  const member = addVirtualMember(salaId, name);
  if (member) {
    revalidatePath(`/sala/${salaId}`);
  }
  return member || null;
}

export async function reclamarCuentaVirtualAction(
  claimToken: string,
  newUserId: string,
  newUserName: string,
  newUserPhone?: string
): Promise<{ success: boolean; message: string }> {
  const success = claimAccount(claimToken, newUserId, newUserName, newUserPhone);
  if (success) {
    revalidatePath('/');
    return { success: true, message: 'Cuenta vinculada exitosamente. Se ha migrado tu saldo e histórico.' };
  }
  return { success: false, message: 'Token de claim inválido o expirado.' };
}

export async function comprarPaseSalaAction(
  salaId: string,
  buyerMemberId: string = CURRENT_USER_ID
): Promise<{ success: boolean; message: string }> {
  const sala = getSalaById(salaId);
  if (!sala) return { success: false, message: 'Sala no encontrada' };

  sala.pass = {
    type: 'pase_sala',
    status: 'activo',
    eventsUsed: 0,
    maxEvents: 20,
    purchasedByMemberId: buyerMemberId,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };

  // Inserción contable: Se inserta como un evento de gasto común de 4.99 € donde el comprador es pagador único
  const passExpenseEvent = {
    id: `pass-event-${Date.now()}`,
    salaId,
    title: 'Activación Pase de Sala (20 eventos IA)',
    venue: 'Stitch Payments',
    date: new Date().toISOString().split('T')[0],
    status: 'cerrado' as const,
    originalPayerId: buyerMemberId,
    items: [
      {
        id: `item-pass-${Date.now()}`,
        name: 'Pase Compartido de Sala (20 eventos)',
        quantity: 1,
        unit_price: 4.99,
        total_price: 4.99,
        category: 'service' as const,
        assignedMemberIds: sala.members.map((m) => m.id), // Dividido equitativamente entre todos
      },
    ],
    commonCosts: [],
    globalModifiers: {},
    totalAmount: 4.99,
    transactions: [],
  };

  sala.eventos.unshift(passExpenseEvent);
  revalidatePath(`/sala/${salaId}`);

  return {
    success: true,
    message: 'Pase de Sala activado. Coste de 4,99 € repartido equitativamente entre los miembros de la sala.',
  };
}
