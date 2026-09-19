import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { parseRouteSlug } from '@/lib/route-utils';
import { getSalasAction, getSalaDetailAction } from '@/actions/salas.actions';
import { getEventoDetailAction } from '@/actions/eventos.actions';
import { getMonederoGlobalAction } from '@/actions/liquidacion.actions';
import { calculateRoomBalance } from '@/lib/store';
import { getCurrentUserAction } from '@/actions/user.actions';
import DashboardView from '@/components/views/DashboardView';
import SalaView from '@/components/views/SalaView';
import EventoLiveView from '@/components/views/EventoLiveView';
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
      getMonederoGlobalAction(currentUser.id, salas => salas), // We need to update this function later
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
        isVirtual: m.isVirtual,
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
    const wallet = await getMonederoGlobalAction(currentUser.id, salas => salas);
    return (
      <div className="w-full max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">
        <header className="py-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-on-surface">Historial &amp; Tickets</h1>
          <Link href="/" className="text-xs text-primary font-semibold hover:underline">
            Volver
          </Link>
        </header>

        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 shadow-xs flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
            <h2 className="text-sm font-bold text-on-surface">Comprobantes Digitalizados</h2>
          </div>
          <p className="text-xs text-outline leading-relaxed">
            Todos los tickets procesados con IA quedan archivados permanentemente en JSON para trazabilidad y auditoría contable.
          </p>
          <div className="divide-y divide-outline-variant/20 pt-2 text-xs text-center p-4">
            <span className="text-outline">No hay actividad reciente.</span>
          </div>
        </section>
      </div>
    );
  }

  // 5. Perfil View (/perfil)
  if (route.type === 'perfil') {
    const wallet = await getMonederoGlobalAction(currentUser.id, salas => salas);
    return (
      <div className="w-full max-w-md mx-auto px-4 pb-28 pt-4 flex flex-col gap-4">
        <header className="py-2 flex items-center justify-between">
          <h1 className="text-xl font-bold text-on-surface">Mi Perfil &amp; Ajustes</h1>
          <Link href="/" className="text-xs text-primary font-semibold hover:underline">
            Volver
          </Link>
        </header>

        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 shadow-xs flex flex-col items-center text-center gap-3">
          <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/30 bg-primary flex items-center justify-center">
            {currentUser.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentUser.avatar_url} alt={currentUser.nick || currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-white font-bold">{(currentUser.nick || currentUser.name).charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-on-surface">{currentUser.nick || currentUser.name}</h2>
            <p className="text-xs text-outline">{currentUser.email || 'Sin correo'} • {currentUser.phone || 'Sin teléfono'}</p>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/20 text-xs">
            <div className="p-2.5 bg-surface-container-low/70 rounded-xl">
              <span className="text-[10px] text-outline block">Total por cobrar</span>
              <span className="font-bold text-primary tabular-nums mt-0.5 block">
                {wallet.totalPorCobrar.toFixed(2).replace('.', ',')} €
              </span>
            </div>
            <div className="p-2.5 bg-surface-container-low/70 rounded-xl">
              <span className="text-[10px] text-outline block">Total por pagar</span>
              <span className="font-bold text-tertiary tabular-nums mt-0.5 block">
                {wallet.totalPorPagar.toFixed(2).replace('.', ',')} €
              </span>
            </div>
          </div>
        </section>

        {/* Políticas de Seguridad y RGPD */}
        <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4 shadow-xs text-xs flex flex-col gap-2">
          <h3 className="font-bold text-on-surface flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-base">verified_user</span>
            Políticas de Integridad y RGPD
          </h3>
          <p className="text-outline leading-relaxed">
            <strong>Regla de Abandono Bloqueado:</strong> No es posible eliminar tu cuenta ni abandonar una sala activa si tu balance neto es distinto de 0,00 €.
          </p>
          <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
            <span className="text-outline">Límite de endeudamiento:</span>
            <span className="font-semibold text-tertiary">-50,00 €</span>
          </div>
        </section>
      </div>
    );
  }

  return notFound();
}
