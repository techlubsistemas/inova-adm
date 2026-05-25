"use client";

import { AdminsTable, type AdminRow } from "@/components/users/admins-table";
import { CreateAdminDialog } from "@/components/users/create-admin-dialog";
import {
  CreateWorkerDialog,
  type WorkerFormData,
  type WorkerInitialData,
} from "@/components/users/create-worker-dialog";
import { TempPasswordDialog } from "@/components/users/temp-password-dialog";
import { WorkersTable, type WorkerRow } from "@/components/users/workers-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApiContext } from "@/context/ApiContext";
import { useCompany } from "@/context/CompanyContext";
import { Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function UsuariosPage() {
  const { GetAPI, PostAPI, PutAPI, PatchAPI } = useApiContext();
  const { isSuperAdmin, selectedCompanyId, companies } = useCompany();

  // Workers state
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [workersError, setWorkersError] = useState<string | null>(null);
  const [workerSearch, setWorkerSearch] = useState("");
  const [showCreateWorker, setShowCreateWorker] = useState(false);
  const [creatingWorker, setCreatingWorker] = useState(false);
  const [editingWorker, setEditingWorker] = useState<WorkerInitialData | null>(null);
  const [savingWorker, setSavingWorker] = useState(false);

  // Admins state
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [adminsLoading, setAdminsLoading] = useState(true);
  const [adminsError, setAdminsError] = useState<string | null>(null);
  const [adminSearch, setAdminSearch] = useState("");
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Temp password dialog
  const [tempPw, setTempPw] = useState<{ name: string; password: string } | null>(null);

  // Reissue confirm
  const [reissueTarget, setReissueTarget] = useState<{ id: string; name: string; type: "worker" | "admin" } | null>(null);

  // ── Fetch ──

  const fetchWorkers = useCallback(async () => {
    const companyId = isSuperAdmin ? selectedCompanyId : undefined;
    if (isSuperAdmin && !companyId) {
      setWorkersLoading(false);
      setWorkers([]);
      return;
    }
    setWorkersLoading(true);
    setWorkersError(null);
    const url = companyId ? `/workers?companyId=${companyId}` : "/workers";
    const res = await GetAPI(url, true);
    if (res.status === 200 && res.body?.workers) {
      setWorkers(res.body.workers);
    } else {
      setWorkersError(res.body?.message || "Falha ao carregar colaboradores.");
      setWorkers([]);
    }
    setWorkersLoading(false);
  }, [GetAPI, isSuperAdmin, selectedCompanyId]);

  const fetchAdmins = useCallback(async () => {
    setAdminsLoading(true);
    setAdminsError(null);
    const res = await GetAPI("/admin", true);
    if (res.status === 200 && res.body?.admins) {
      setAdmins(res.body.admins);
    } else {
      setAdminsError(res.body?.message || "Falha ao carregar administradores.");
      setAdmins([]);
    }
    setAdminsLoading(false);
  }, [GetAPI]);

  useEffect(() => {
    fetchWorkers();
    fetchAdmins();
  }, [fetchWorkers, fetchAdmins]);

  // ── Create Worker ──

  async function handleCreateWorker(data: WorkerFormData) {
    setCreatingWorker(true);
    const companyId = isSuperAdmin ? selectedCompanyId : undefined;
    const payload = { ...data, companyId };
    const res = await PostAPI("/workers", payload, true);
    setCreatingWorker(false);

    if (res.status === 200 || res.status === 201) {
      setShowCreateWorker(false);
      toast.success("Colaborador criado.");
      setTempPw({ name: data.name ?? "Colaborador", password: res.body?.tempPassword ?? "" });
      fetchWorkers();
    } else {
      toast.error(res.body?.message || "Erro ao criar colaborador.");
    }
  }

  async function handleEditWorker(data: WorkerFormData) {
    if (!editingWorker?.id) return;
    setSavingWorker(true);
    const companyId = isSuperAdmin ? selectedCompanyId : undefined;
    const payload = { ...data, companyId };
    const res = await PutAPI(`/workers/${editingWorker.id}`, payload, true);
    setSavingWorker(false);

    if (res.status === 200 || res.status === 201) {
      setEditingWorker(null);
      toast.success("Colaborador atualizado.");
      fetchWorkers();
    } else {
      toast.error(res.body?.message || "Erro ao atualizar colaborador.");
    }
  }

  // ── Create Admin ──

  async function handleCreateAdmin(data: { name: string; email: string; companyId?: string }) {
    setCreatingAdmin(true);
    const payload = { name: data.name, email: data.email, companyId: data.companyId || null };
    const res = await PostAPI("/admin/create", payload, true);
    setCreatingAdmin(false);

    if (res.status === 200 || res.status === 201) {
      setShowCreateAdmin(false);
      toast.success("Administrador criado.");
      setTempPw({ name: data.name, password: res.body?.tempPassword ?? "" });
      fetchAdmins();
    } else {
      toast.error(res.body?.message || "Erro ao criar administrador.");
    }
  }

  // ── Reissue ──

  async function handleReissueConfirm() {
    if (!reissueTarget) return;
    const { id, name, type } = reissueTarget;
    const companyId = isSuperAdmin ? selectedCompanyId : undefined;

    const url = type === "worker"
      ? `/workers/${id}/reissue-temp-password${companyId ? `?companyId=${companyId}` : ""}`
      : `/admin/${id}/reissue-temp-password`;

    const res = await PatchAPI(url, {}, true);

    if (res.status === 200) {
      setTempPw({ name, password: res.body?.tempPassword ?? "" });
      toast.success("Senha temporária reemitida.");
      type === "worker" ? fetchWorkers() : fetchAdmins();
    } else {
      toast.error(res.body?.message || "Erro ao reemitir senha.");
    }
    setReissueTarget(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Usuários</h1>
        <p className="text-slate-500">Gerencie colaboradores e administradores</p>
      </div>

      {isSuperAdmin && !selectedCompanyId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <p className="text-sm">
            Selecione uma empresa no dropdown do header para visualizar os colaboradores.
          </p>
        </div>
      )}

      <Tabs defaultValue="workers">
        <TabsList>
          <TabsTrigger value="workers">Colaboradores</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="admins">Administradores</TabsTrigger>}
        </TabsList>

        {/* ── Workers Tab ── */}
        <TabsContent value="workers">
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar colaborador..."
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  className="border-input placeholder:text-muted-foreground focus-visible:ring-primary h-9 w-full rounded-md border bg-transparent pl-9 pr-3 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowCreateWorker(true)}
                disabled={isSuperAdmin && !selectedCompanyId}
                className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                Novo Colaborador
              </button>
            </div>

            <WorkersTable
              workers={workers}
              loading={workersLoading}
              error={workersError}
              search={workerSearch}
              onReissue={(w) => setReissueTarget({ id: w.id, name: w.name, type: "worker" })}
              onEdit={(w) => setEditingWorker({
                id: w.id,
                name: w.name,
                phone: w.phone,
                cpf: w.cpf ?? "",
                rg: w.rg ?? "",
                address: w.address ?? "",
                neighborhood: w.neighborhood ?? "",
                city: w.city,
                state: w.state ?? "",
                zipCode: w.zipCode ?? "",
                extension: w.extension ?? "",
                accessLevelId: w.accessLevelId ?? null,
                workerRoleIds: w.workerRoleIds ?? [],
              })}
            />
          </div>
        </TabsContent>

        {/* ── Admins Tab ── */}
        {isSuperAdmin && (
          <TabsContent value="admins">
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar administrador..."
                    value={adminSearch}
                    onChange={(e) => setAdminSearch(e.target.value)}
                    className="border-input placeholder:text-muted-foreground focus-visible:ring-primary h-9 w-full rounded-md border bg-transparent pl-9 pr-3 text-sm shadow-sm focus-visible:ring-1 focus-visible:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateAdmin(true)}
                  className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Novo Administrador
                </button>
              </div>

              <AdminsTable
                admins={admins}
                loading={adminsLoading}
                error={adminsError}
                search={adminSearch}
                isSuperAdmin={isSuperAdmin}
                onReissue={(a) => setReissueTarget({ id: a.id, name: a.name, type: "admin" })}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* ── Dialogs ── */}
      <CreateWorkerDialog
        open={showCreateWorker}
        onOpenChange={setShowCreateWorker}
        onSubmit={handleCreateWorker}
        isSubmitting={creatingWorker}
      />

      <CreateWorkerDialog
        open={!!editingWorker}
        onOpenChange={(open) => {
          if (!open) setEditingWorker(null);
        }}
        onSubmit={handleEditWorker}
        isSubmitting={savingWorker}
        initialData={editingWorker}
      />

      <CreateAdminDialog
        open={showCreateAdmin}
        onOpenChange={setShowCreateAdmin}
        onSubmit={handleCreateAdmin}
        isSubmitting={creatingAdmin}
        companies={companies}
      />

      {tempPw && (
        <TempPasswordDialog
          open={!!tempPw}
          onOpenChange={(open) => { if (!open) setTempPw(null); }}
          userName={tempPw.name}
          tempPassword={tempPw.password}
        />
      )}

      <ConfirmDialog
        open={!!reissueTarget}
        onOpenChange={(open) => { if (!open) setReissueTarget(null); }}
        title="Reemitir senha temporária"
        description={`A senha atual de "${reissueTarget?.name}" será invalidada e uma nova senha temporária será gerada. Deseja continuar?`}
        confirmLabel="Reemitir"
        variant="danger"
        onConfirm={handleReissueConfirm}
      />
    </div>
  );
}
