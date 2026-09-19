import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { parseRouteSlug } from '@/lib/route-utils';
import { getSalasAction, getSalaDetailAction } from '@/actions/salas.actions';
import { getEventoDetailAction } from '@/actions/eventos.actions';
import { getMonederoGlobalAction } from '@/actions/liquidacion.actions';
import { getActividadGlobalAction } from '@/actions/actividad.actions';
import { calculateRoomBalance } from '@/lib/store';
import { getCurrentUserAction } from '@/actions/user.actions';
import DashboardView from '@/components/views/DashboardView';
import SalaView from '@/components/views/SalaView';
import EventoLiveView from '@/components/views/EventoLiveView';
import ActividadView from '@/components/views/ActividadView';
import PerfilView from '@/components/views/PerfilView';
import Link from 'next/link';

interface PageProps {
  params: Promise<{
    slug?: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const route = parseRouteSlug(slug);

  return {
    title: route.title,
    description: route.description,
  };
}

export default async function OrchestratorPage({ params }: PageProps) {
  const { slug } = await params;
  const route = parseRouteSlug(slug);

  const currentUser = await getCurrentUserAction();
  if (!currentUser) {
    redirect('/login');
  }

  // 1. Dashboard View (/)
  if (route.type === 'dashboard') {
    const [wallet, salas] = await Promise.all([
      getMonederoGlobalAction(currentUser.id), // Removed salas => salas
      getSalasAction(),
    ]);

    // Force real user data into the wallet for Dashboard
    wallet.userId = currentUser.id;
    wallet.userName = currentUser.nick || currentUser.name;
    wallet.avatarUrl = currentUser.avatar_url || wallet.avatarUrl;

    return <DashboardView wallet={wallet} salas={salas} currentUserId={currentUser.id} />;
  }

  // 2. Sala View (/sala/[salaId])
  if (route.type === 'sala' && route.salaId) {
    const sala = await getSalaDetailAction(route.salaId);
    if (!sala) return notFound();

    const myMember = sala.members.find((m) => m.id === currentUser.id || m.registeredUserId === currentUser.id) || sala.members[0];
    const targetUserId = myMember ? myMember.id : currentUser.id;
    const balance = calculateRoomBalance(sala, targetUserId);
    const allBalances = sala.members.map((m) => {
      const calc = calculateRoomBalance(sala, m.id);
      return {
        memberId: m.id,
        name: m.name,
        phone: m.phone,
        isVirtual: m.isVirtual ?? false,
        netBalance: calc.netBalance,
      };
    });

    return <SalaView sala={sala} balanceCalculation={balance} allBalances={allBalances} currentUserId={targetUserId} />;
  }

  // 3. Evento Live View (/sala/[salaId]/evento/[eventoId] or /evento/[eventoId])
  if (route.type === 'evento' && route.salaId && route.eventoId) {
    const [sala, evento] = await Promise.all([
      getSalaDetailAction(route.salaId),
      getEventoDetailAction(route.salaId, route.eventoId),
    ]);

    if (!sala || !evento) return notFound();

    const myMember = sala.members.find((m) => m.id === currentUser.id || m.registeredUserId === currentUser.id) || sala.members[0];
    const targetUserId = myMember ? myMember.id : currentUser.id;

    return <EventoLiveView sala={sala} evento={evento} currentUserId={targetUserId} />;
  }

  // 4. Actividad View (/actividad)
  if (route.type === 'actividad') {
    const activities = await getActividadGlobalAction(currentUser.id);
    return <ActividadView activities={activities} currentUserId={currentUser.id} />;
  }

  // 5. Perfil View (/perfil)
  if (route.type === 'perfil') {
    const wallet = await getMonederoGlobalAction(currentUser.id);
    
    // Ensure all required fields exist for the interface
    const userData = {
      id: currentUser.id,
      name: currentUser.name || '',
      nick: currentUser.nick || null,
      email: currentUser.email || null,
      phone: currentUser.phone || null,
      avatar_url: currentUser.avatar_url || null,
    };

    return <PerfilView user={userData} wallet={{ totalPorCobrar: wallet.totalPorCobrar, totalPorPagar: wallet.totalPorPagar }} />;
  }

  return notFound();
}
