import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, TextInput, Alert,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useProjects } from "@/src/hooks/useProjects";
import {
  useVendors, useSubmitPO, useCreateVendor, useCreateRFQ,
  useCreateGRN, useRFQs, usePurchaseOrders, useGRNs,
} from "@/src/hooks/useProcurement";

type Section = "vendors" | "pos" | "rfqs" | "grns" | null;

const SECTION_META: Record<string, { icon: string; title: string }> = {
  vendors: { icon: "🏢", title: "Vendors" },
  pos: { icon: "📋", title: "Purchase Orders" },
  rfqs: { icon: "📩", title: "RFQs" },
  grns: { icon: "📦", title: "Goods Receipt Notes" },
};

export default function ProcurementScreen() {
  const [section, setSection] = useState<Section>(null);
  const [mode, setMode] = useState<"list" | "detail" | "create" | "done">("list");
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [doneMsg, setDoneMsg] = useState("");

  if (!section) {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <Text style={s.title}>Procurement</Text>
        <Text style={s.sub}>Select a module</Text>
        {Object.entries(SECTION_META).map(([key, meta]) => (
          <TouchableOpacity
            key={key}
            style={s.sectionCard}
            onPress={() => setSection(key as Section)}
          >
            <Text style={s.sectionIcon}>{meta.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionTitle}>{meta.title}</Text>
            </View>
            <Text style={s.chevron}>→</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  if (section === "vendors") {
    if (mode === "create") {
      return (
        <VendorCreateForm
          onBack={() => setMode("list")}
          onDone={(msg) => { setDoneMsg(msg); setMode("done"); }}
        />
      );
    }
    if (mode === "done") {
      return (
        <DoneScreen
          message={doneMsg}
          onNew={() => { setMode("list"); }}
          onBackToSections={() => { setSection(null); setMode("list"); }}
        />
      );
    }
    return (
      <VendorList
        onBack={() => setSection(null)}
        onCreate={() => setMode("create")}
      />
    );
  }

  // Sections that need project selection
  if (!selectedProject) {
    return (
      <ProjectSelect
        onBack={() => setSection(null)}
        onSelect={(p) => setSelectedProject(p)}
      />
    );
  }

  if (section === "pos") {
    return (
      <POListScreen
        project={selectedProject}
        onBack={() => { setSelectedProject(null); }}
        onBackToSection={() => { setSelectedProject(null); setSection(null); }}
      />
    );
  }

  if (section === "rfqs") {
    return (
      <RFQListScreen
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  if (section === "grns") {
    return (
      <GRNListScreen
        project={selectedProject}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  return null;
}

function ProjectSelect({ onBack, onSelect }: { onBack: () => void; onSelect: (p: any) => void }) {
  const { data: projects } = useProjects();
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={onBack} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.title}>Select Project</Text>
      <Text style={s.sub}>Choose a project to continue</Text>
      {projects?.filter((p: any) => p.status === "active").map((p: any) => (
        <TouchableOpacity key={p.id} style={s.projectCard} onPress={() => onSelect(p)}>
          <Text style={s.projectName}>{p.name}</Text>
          <Text style={s.projectCode}>{p.code}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function DoneScreen({ message, onNew, onBackToSections }: { message: string; onNew: () => void; onBackToSections: () => void }) {
  return (
    <View style={[s.container, s.centered]}>
      <Text style={s.successIcon}>✅</Text>
      <Text style={s.successTitle}>Done!</Text>
      <Text style={s.successSub}>{message}</Text>
      <TouchableOpacity style={s.btn} onPress={onNew}><Text style={s.btnText}>Create another</Text></TouchableOpacity>
      <TouchableOpacity style={[s.btn, s.btnOutline]} onPress={onBackToSections}><Text style={s.btnOutlineText}>Back to sections</Text></TouchableOpacity>
    </View>
  );
}

// ── Vendors ──

function VendorList({ onBack, onCreate }: { onBack: () => void; onCreate: () => void }) {
  const [search, setSearch] = useState("");
  const { data: vendors, isLoading } = useVendors(search || undefined);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backRow}><Text style={s.backText}>← Back</Text></TouchableOpacity>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={s.title}>Vendors</Text>
          <TouchableOpacity style={s.smallBtn} onPress={onCreate}><Text style={s.smallBtnText}>+ Add</Text></TouchableOpacity>
        </View>
      </View>
      <View style={s.searchWrap}>
        <TextInput style={s.search} placeholder="Search vendors..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
      </View>
      <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
        ) : !vendors?.length ? (
          <View style={s.emptyState}><Text style={s.emptyEmoji}>🏢</Text><Text style={s.emptyText}>No vendors found</Text></View>
        ) : vendors.map((v: any) => (
          <View key={v.id} style={s.card}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{v.name}</Text>
              <Text style={s.cardSub}>{v.code}{v.city ? ` · ${v.city}` : ""}{v.category ? ` · ${v.category}` : ""}</Text>
              {v.contact_person && <Text style={s.cardMeta}>{v.contact_person}{v.phone ? ` · ${v.phone}` : ""}</Text>}
            </View>
            <View style={[s.badge, { backgroundColor: v.status === "active" ? "#dcfce7" : "#f3f4f6" }]}>
              <Text style={[s.badgeText, { color: v.status === "active" ? "#16a34a" : "#4b5563" }]}>{v.status}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function VendorCreateForm({ onBack, onDone }: { onBack: () => void; onDone: (msg: string) => void }) {
  const createVendor = useCreateVendor();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("other");
  const [contactPerson, setContactPerson] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const submit = async () => {
    if (!name || !code) { Alert.alert("Error", "Name and code are required"); return; }
    try {
      await createVendor.mutateAsync({ name, code, category, contact_person: contactPerson || undefined, email: email || undefined, phone: phone || undefined, city: city || undefined });
      onDone(`Vendor "${name}" created`);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to create vendor");
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={onBack} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.title}>Add Vendor</Text>
      <Text style={s.label}>Name *</Text>
      <TextInput style={s.input} placeholder="Vendor name" value={name} onChangeText={setName} />
      <Text style={s.label}>Code *</Text>
      <TextInput style={s.input} placeholder="e.g. VEN-001" value={code} onChangeText={setCode} autoCapitalize="characters" />
      <Text style={s.label}>Category</Text>
      <TextInput style={s.input} placeholder="e.g. supplier, contractor" value={category} onChangeText={setCategory} />
      <Text style={s.label}>Contact person</Text>
      <TextInput style={s.input} placeholder="Name" value={contactPerson} onChangeText={setContactPerson} />
      <Text style={s.label}>Email</Text>
      <TextInput style={s.input} placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Text style={s.label}>Phone</Text>
      <TextInput style={s.input} placeholder="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
      <Text style={s.label}>City</Text>
      <TextInput style={s.input} placeholder="City" value={city} onChangeText={setCity} />
      <TouchableOpacity style={[s.btn, createVendor.isPending && s.btnDisabled]} onPress={submit} disabled={createVendor.isPending}>
        {createVendor.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create Vendor</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Purchase Orders ──

function POListScreen({ project, onBack, onBackToSection }: { project: any; onBack: () => void; onBackToSection: () => void }) {
  const { data: pos, isLoading } = usePurchaseOrders(project.id);
  const submitPO = useSubmitPO(project.id);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [mode, setMode] = useState<"list" | "create" | "detail">("list");

  if (selectedPO) {
    return <PODetail po={selectedPO} onBack={() => setSelectedPO(null)} onSubmit={(id) => submitPO.mutateAsync(id).then(() => { setSelectedPO(null); })} submitPending={submitPO.isPending} />;
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backRow}><Text style={s.backText}>← Back</Text></TouchableOpacity>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={s.title}>Purchase Orders</Text>
          <TouchableOpacity style={s.smallBtn} onPress={() => setMode("create")}><Text style={s.smallBtnText}>+ Create</Text></TouchableOpacity>
        </View>
        <Text style={s.sub}>{project.name}</Text>
      </View>
      <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
        ) : !pos?.length ? (
          <View style={s.emptyState}><Text style={s.emptyEmoji}>📋</Text><Text style={s.emptyText}>No purchase orders yet</Text></View>
        ) : pos.map((po: any) => (
          <TouchableOpacity key={po.id} style={s.card} onPress={() => setSelectedPO(po)}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{po.po_number}</Text>
              <Text style={s.cardSub}>NPR {po.grand_total?.toLocaleString()}</Text>
            </View>
            <StatusBadge status={po.status} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function PODetail({ po, onBack, onSubmit, submitPending }: { po: any; onBack: () => void; onSubmit: (id: string) => void; submitPending: boolean }) {
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={onBack} style={s.back}><Text style={s.backText}>← POs</Text></TouchableOpacity>
      <Text style={s.title}>{po.po_number}</Text>
      <StatusBadge status={po.status} />
      <View style={s.infoCard}>
        {[
          ["Status", po.status?.replace(/_/g, " ")],
          ["Total amount", `NPR ${po.total_amount?.toLocaleString()}`],
          ["Tax", `NPR ${po.tax_amount?.toLocaleString()}`],
          ["Grand total", `NPR ${po.grand_total?.toLocaleString()}`],
          ["Currency", po.currency],
          ["Delivery", po.delivery_date ?? "—"],
          ["Approved by", po.approved_by ?? "—"],
        ].map(([l, v]) => (
          <View key={l} style={s.infoRow}><Text style={s.infoLabel}>{l}</Text><Text style={s.infoValue}>{v}</Text></View>
        ))}
      </View>
      {po.items?.length > 0 && (
        <>
          <Text style={s.sectionLabel}>Items</Text>
          <View style={s.infoCard}>
            {po.items.map((item: any, i: number) => (
              <View key={item.id} style={[s.infoRow, i === po.items.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}><Text style={s.infoValue}>{item.description}</Text><Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{item.quantity} {item.unit} × NPR {item.unit_rate}</Text></View>
                <Text style={[s.infoLabel, { fontWeight: "600" }]}>NPR {item.amount?.toLocaleString()}</Text>
              </View>
            ))}
          </View>
        </>
      )}
      {po.status === "draft" && (
        <TouchableOpacity style={[s.btn, submitPending && s.btnDisabled]} onPress={() => onSubmit(po.id)} disabled={submitPending}>
          {submitPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Submit for Approval</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ── RFQs ──

function RFQListScreen({ project, onBack }: { project: any; onBack: () => void }) {
  const { data: rfqs, isLoading } = useRFQs(project.id);
  const [mode, setMode] = useState<"list" | "create">("list");

  if (mode === "create") {
    return <RFQCreateForm project={project} onBack={() => setMode("list")} />;
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backRow}><Text style={s.backText}>← Back</Text></TouchableOpacity>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={s.title}>RFQs</Text>
          <TouchableOpacity style={s.smallBtn} onPress={() => setMode("create")}><Text style={s.smallBtnText}>+ Create</Text></TouchableOpacity>
        </View>
        <Text style={s.sub}>{project.name}</Text>
      </View>
      <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
        ) : !rfqs?.length ? (
          <View style={s.emptyState}><Text style={s.emptyEmoji}>📩</Text><Text style={s.emptyText}>No RFQs yet</Text></View>
        ) : rfqs.map((rfq: any) => (
          <View key={rfq.id} style={s.card}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{rfq.title}</Text>
              <Text style={s.cardSub}>{rfq.rfq_number}</Text>
            </View>
            <StatusBadge status={rfq.status} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function RFQCreateForm({ project, onBack }: { project: any; onBack: () => void }) {
  const createRFQ = useCreateRFQ(project.id);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [items, setItems] = useState([{ description: "", unit: "pcs", quantity: "" }]);

  const addItem = () => setItems([...items, { description: "", unit: "pcs", quantity: "" }]);

  const submit = async () => {
    if (!title) { Alert.alert("Error", "Title is required"); return; }
    const validItems = items.filter(i => i.description);
    try {
      await createRFQ.mutateAsync({
        title, description: description || undefined,
        due_date: dueDate || undefined,
        items: validItems.map(i => ({ ...i, quantity: parseFloat(i.quantity) || 0 })),
      });
      Alert.alert("Success", "RFQ created", [{ text: "OK", onPress: onBack }]);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to create RFQ");
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={onBack} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>
      <Text style={s.title}>Create RFQ</Text>
      <Text style={s.sub}>{project.name}</Text>
      <Text style={s.label}>Title *</Text>
      <TextInput style={s.input} placeholder="RFQ title" value={title} onChangeText={setTitle} />
      <Text style={s.label}>Description</Text>
      <TextInput style={[s.input, s.textarea]} multiline numberOfLines={3} placeholder="Description" value={description} onChangeText={setDescription} />
      <Text style={s.label}>Due date</Text>
      <TextInput style={s.input} placeholder="YYYY-MM-DD" value={dueDate} onChangeText={setDueDate} />
      <Text style={s.sectionLabel}>Items</Text>
      {items.map((item, i) => (
        <View key={i} style={s.itemCard}>
          <TextInput style={s.input} placeholder="Description" value={item.description} onChangeText={v => { const u = [...items]; u[i].description = v; setItems(u); }} />
          <View style={s.row}>
            <TextInput style={[s.input, { flex: 1, marginRight: 8 }]} placeholder="Qty" keyboardType="numeric" value={item.quantity} onChangeText={v => { const u = [...items]; u[i].quantity = v; setItems(u); }} />
            <TextInput style={[s.input, { flex: 1 }]} placeholder="Unit" value={item.unit} onChangeText={v => { const u = [...items]; u[i].unit = v; setItems(u); }} />
          </View>
        </View>
      ))}
      <TouchableOpacity style={s.addBtn} onPress={addItem}><Text style={s.addBtnText}>+ Add item</Text></TouchableOpacity>
      <TouchableOpacity style={[s.btn, createRFQ.isPending && s.btnDisabled]} onPress={submit} disabled={createRFQ.isPending}>
        {createRFQ.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create RFQ</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── GRNs ──

function GRNListScreen({ project, onBack }: { project: any; onBack: () => void }) {
  const { data: grns, isLoading } = useGRNs(project.id);
  const [mode, setMode] = useState<"list" | "create">("list");

  if (mode === "create") {
    return <GRNCreateForm project={project} onBack={() => setMode("list")} />;
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backRow}><Text style={s.backText}>← Back</Text></TouchableOpacity>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={s.title}>Goods Receipt Notes</Text>
          <TouchableOpacity style={s.smallBtn} onPress={() => setMode("create")}><Text style={s.smallBtnText}>+ Create</Text></TouchableOpacity>
        </View>
        <Text style={s.sub}>{project.name}</Text>
      </View>
      <ScrollView contentContainerStyle={s.listContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
        ) : !grns?.length ? (
          <View style={s.emptyState}><Text style={s.emptyEmoji}>📦</Text><Text style={s.emptyText}>No GRNs yet</Text></View>
        ) : grns.map((grn: any) => (
          <View key={grn.id} style={s.card}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{grn.grn_number}</Text>
              <Text style={s.cardSub}>{grn.received_date} · Inspection: {grn.inspection_passed ? "✅" : "❌"}</Text>
            </View>
            <StatusBadge status={grn.status} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function GRNCreateForm({ project, onBack }: { project: any; onBack: () => void }) {
  const { data: pos } = usePurchaseOrders(project.id);
  const createGRN = useCreateGRN(project.id);
  const [selectedPO, setSelectedPO] = useState<any>(null);
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"select_po" | "form">("select_po");

  if (step === "select_po") {
    return (
      <ScrollView style={s.container} contentContainerStyle={s.content}>
        <TouchableOpacity onPress={onBack} style={s.back}><Text style={s.backText}>← Back</Text></TouchableOpacity>
        <Text style={s.title}>Create GRN</Text>
        <Text style={s.sub}>Select a purchase order</Text>
        {pos?.filter((p: any) => p.status === "approved" || p.status === "partially_received").map((po: any) => (
          <TouchableOpacity key={po.id} style={s.projectCard} onPress={() => { setSelectedPO(po); setStep("form"); }}>
            <Text style={s.projectName}>{po.po_number}</Text>
            <Text style={s.projectCode}>NPR {po.grand_total?.toLocaleString()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  const submit = async () => {
    if (!selectedPO) return;
    try {
      await createGRN.mutateAsync({
        po_id: selectedPO.id,
        received_date: receivedDate,
        notes: notes || undefined,
        items: (selectedPO.items || []).map((item: any) => ({
          po_item_id: item.id,
          description: item.description,
          unit: item.unit,
          ordered_quantity: item.quantity,
          received_quantity: item.quantity,
          rejected_quantity: 0,
          unit_rate: item.unit_rate,
        })),
      });
      Alert.alert("Success", "GRN created", [{ text: "OK", onPress: onBack }]);
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to create GRN");
    }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <TouchableOpacity onPress={() => setStep("select_po")} style={s.back}><Text style={s.backText}>← PO selection</Text></TouchableOpacity>
      <Text style={s.title}>GRN for {selectedPO?.po_number}</Text>
      <Text style={s.label}>Received date</Text>
      <TextInput style={s.input} placeholder="YYYY-MM-DD" value={receivedDate} onChangeText={setReceivedDate} />
      <Text style={s.label}>Notes</Text>
      <TextInput style={[s.input, s.textarea]} multiline numberOfLines={3} placeholder="Notes..." value={notes} onChangeText={setNotes} />
      <Text style={s.sectionLabel}>All items will be received in full</Text>
      <TouchableOpacity style={[s.btn, createGRN.isPending && s.btnDisabled]} onPress={submit} disabled={createGRN.isPending}>
        {createGRN.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Create GRN</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Shared components ──

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, [string, string]> = {
    draft: ["#f3f4f6", "#4b5563"], pending_approval: ["#dbeafe", "#1d4ed8"],
    submitted: ["#dbeafe", "#1d4ed8"], approved: ["#dcfce7", "#16a34a"],
    rejected: ["#fee2e2", "#dc2626"], active: ["#dcfce7", "#16a34a"],
    sent: ["#dbeafe", "#1d4ed8"], confirmed: ["#dcfce7", "#16a34a"],
    partially_received: ["#fef9c3", "#a16207"],
  };
  const [bg, fg] = colors[status] ?? ["#f3f4f6", "#4b5563"];
  return (
    <View style={[s.statusBadge, { backgroundColor: bg }]}>
      <Text style={[s.statusText, { color: fg }]}>{status.replace(/_/g, " ")}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  back: { marginBottom: 12 },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backText: { color: "#2563eb", fontSize: 14 },
  header: { backgroundColor: "#fff", padding: 16, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginTop: 2, marginBottom: 16 },
  sectionCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16,
    marginBottom: 10, flexDirection: "row", alignItems: "center",
    borderWidth: 0.5, borderColor: "#e5e7eb",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  sectionIcon: { fontSize: 28, marginRight: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  chevron: { fontSize: 18, color: "#9ca3af" },
  projectCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16,
    marginBottom: 8, borderLeftWidth: 4, borderLeftColor: "#2563eb",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  projectName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  projectCode: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  searchWrap: { padding: 12, backgroundColor: "#fff", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  search: { backgroundColor: "#f9fafb", borderRadius: 10, height: 40, paddingHorizontal: 14, fontSize: 14, color: "#111827", borderWidth: 1, borderColor: "#e5e7eb" },
  listContent: { padding: 12 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#9ca3af" },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    marginBottom: 8, flexDirection: "row", alignItems: "center",
    borderWidth: 0.5, borderColor: "#e5e7eb",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  cardTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  cardSub: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  cardMeta: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  badge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  badgeText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  statusBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  statusText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  infoCard: { backgroundColor: "#fff", borderRadius: 14, overflow: "hidden", borderWidth: 0.5, borderColor: "#e5e7eb", marginBottom: 4 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6" },
  infoLabel: { fontSize: 13, color: "#6b7280" },
  infoValue: { fontSize: 13, fontWeight: "500", color: "#111827", textTransform: "capitalize" },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 16, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "500", color: "#374151", marginTop: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: "#111827", backgroundColor: "#fff" },
  textarea: { height: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", marginTop: 6 },
  itemCard: { backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  addBtn: { borderWidth: 1, borderColor: "#2563eb", borderRadius: 8, paddingVertical: 10, alignItems: "center", borderStyle: "dashed", marginTop: 4 },
  addBtnText: { color: "#2563eb", fontSize: 14, fontWeight: "500" },
  btn: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 20 },
  btnOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#2563eb" },
  btnOutlineText: { color: "#2563eb", fontSize: 16, fontWeight: "600" },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  smallBtn: { backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  smallBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  successIcon: { fontSize: 52, marginBottom: 16 },
  successTitle: { fontSize: 20, fontWeight: "700", color: "#111827", marginBottom: 6 },
  successSub: { fontSize: 13, color: "#6b7280", marginBottom: 24, textAlign: "center" },
});
