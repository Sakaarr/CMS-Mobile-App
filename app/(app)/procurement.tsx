import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, RefreshControl, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProjects } from "@/src/hooks/useProjects";
import {
  usePurchaseOrders, useVendors, useGRNs,
  useCreateVendor, useSubmitPO, useCreateGRN, useConfirmGRN,
  type Vendor, type PO, type GRN,
} from "@/src/hooks/useProcurement";
import { SyncBanner } from "@/src/components/SyncBanner";
import { useQueryClient } from "@tanstack/react-query";

type Tab = "pos" | "vendors" | "grns";

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280", pending_approval: "#f59e0b",
  approved: "#10b981", rejected: "#ef4444", sent: "#3b82f6",
  partially_received: "#8b5cf6", fully_received: "#10b981", cancelled: "#6b7280",
  confirmed: "#10b981", active: "#10b981",
};

export default function ProcurementScreen() {
  const [tab, setTab] = useState<Tab>("pos");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { data: projects } = useProjects();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
    await queryClient.invalidateQueries({ queryKey: ["vendors"] });
    await queryClient.invalidateQueries({ queryKey: ["grns"] });
    setRefreshing(false);
  }, []);

  if (!selectedProjectId) {
    return (
      <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
        <SyncBanner />
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 12, color: "#111827" }}>
            Select Project
          </Text>
          <ScrollView>
            {projects?.map((p: any) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedProjectId(p.id)}
                style={{
                  backgroundColor: "#fff", padding: 16, borderRadius: 12,
                  marginBottom: 8, borderWidth: 1, borderColor: "#e5e7eb",
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>{p.name}</Text>
                <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{p.code}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#f9fafb" }}>
      <SyncBanner />
      {/* Tab bar */}
      <View style={{ flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" }}>
        {([["pos", "POs"], ["vendors", "Vendors"], ["grns", "GRNs"]] as [Tab, string][]).map(([key, label]) => (
          <TouchableOpacity
            key={key}
            onPress={() => setTab(key)}
            style={{
              flex: 1, paddingVertical: 12, alignItems: "center",
              borderBottomWidth: tab === key ? 2 : 0, borderBottomColor: "#2563eb",
            }}
          >
            <Text style={{
              fontSize: 14, fontWeight: "600",
              color: tab === key ? "#2563eb" : "#6b7280",
            }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {tab === "pos" && <POList projectId={selectedProjectId} />}
        {tab === "vendors" && <VendorList />}
        {tab === "grns" && <GRNList projectId={selectedProjectId} />}
      </ScrollView>
    </View>
  );
}

function POList({ projectId }: { projectId: string }) {
  const { data: pos, isLoading, isError } = usePurchaseOrders(projectId);
  const submitPO = useSubmitPO(projectId);
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (isError) return <Text style={{ color: "#ef4444", textAlign: "center", marginTop: 40 }}>Failed to load POs</Text>;

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShowCreate(true)}
        style={{
          backgroundColor: "#2563eb", padding: 12, borderRadius: 8,
          alignItems: "center", marginBottom: 16,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>+ New PO</Text>
      </TouchableOpacity>

      {(!pos || pos.length === 0) && (
        <Text style={{ color: "#9ca3af", textAlign: "center", marginTop: 40 }}>No purchase orders</Text>
      )}
      {(pos || []).map((po: PO) => (
        <View key={po.id} style={{
          backgroundColor: "#fff", padding: 14, borderRadius: 10,
          marginBottom: 8, borderWidth: 1, borderColor: "#e5e7eb",
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>{po.po_number}</Text>
            <View style={{
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
              backgroundColor: (STATUS_COLORS[po.status] || "#6b7280") + "20",
            }}>
              <Text style={{
                fontSize: 11, fontWeight: "600", color: STATUS_COLORS[po.status] || "#6b7280",
                textTransform: "capitalize",
              }}>{po.status.replace(/_/g, " ")}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            {po.currency} {po.grand_total?.toLocaleString()}
          </Text>
          {po.status === "draft" && (
            <TouchableOpacity
              onPress={() => submitPO.mutate(po.id)}
              style={{ marginTop: 8, padding: 8, backgroundColor: "#f59e0b", borderRadius: 6, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Submit for Approval</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <CreatePOForm projectId={projectId} visible={showCreate} onClose={() => setShowCreate(false)} />
    </View>
  );
}

function CreatePOForm({ projectId, visible, onClose }: { projectId: string; visible: boolean; onClose: () => void }) {
  const createPO = useCreatePO(projectId);
  const { data: vendors } = useVendors();
  const [vendorId, setVendorId] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreate = async () => {
    if (!vendorId) { Alert.alert("Error", "Please select a vendor"); return; }
    try {
      await createPO.mutateAsync({
        vendor_id: vendorId,
        notes: notes || undefined,
        items: [{ description: "Item", unit: "NOS", quantity: 1, unit_rate: 0 }],
      });
      Alert.alert("Success", "PO created");
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to create PO");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, maxHeight: "80%" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#111827" }}>New Purchase Order</Text>

          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 4 }}>Vendor</Text>
          <ScrollView horizontal style={{ marginBottom: 12 }}>
            {(vendors || []).map((v: Vendor) => (
              <TouchableOpacity
                key={v.id}
                onPress={() => setVendorId(v.id)}
                style={{
                  padding: 10, borderRadius: 8, marginRight: 8,
                  backgroundColor: vendorId === v.id ? "#2563eb" : "#f3f4f6",
                }}
              >
                <Text style={{ color: vendorId === v.id ? "#fff" : "#374151", fontWeight: "600", fontSize: 13 }}>{v.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 4 }}>Notes</Text>
          <TextInput
            style={{
              borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
              padding: 10, marginBottom: 16, fontSize: 14,
            }}
            value={notes} onChangeText={setNotes} placeholder="Optional notes"
          />

          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: "#f3f4f6", alignItems: "center" }}>
              <Text style={{ fontWeight: "600", color: "#374151" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreate} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: "#2563eb", alignItems: "center" }}>
              <Text style={{ fontWeight: "600", color: "#fff" }}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function VendorList() {
  const { data: vendors, isLoading, isError } = useVendors();
  const createVendor = useCreateVendor();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (isError) return <Text style={{ color: "#ef4444", textAlign: "center", marginTop: 40 }}>Failed to load vendors</Text>;

  const handleCreate = async () => {
    if (!name || !code) { Alert.alert("Error", "Name and code are required"); return; }
    try {
      await createVendor.mutateAsync({ name, code, email: email || undefined, phone: phone || undefined });
      Alert.alert("Success", "Vendor created");
      setShowCreate(false); setName(""); setCode(""); setEmail(""); setPhone("");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to create vendor");
    }
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShowCreate(true)}
        style={{
          backgroundColor: "#2563eb", padding: 12, borderRadius: 8,
          alignItems: "center", marginBottom: 16,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>+ New Vendor</Text>
      </TouchableOpacity>

      {(!vendors || vendors.length === 0) && (
        <Text style={{ color: "#9ca3af", textAlign: "center", marginTop: 40 }}>No vendors</Text>
      )}
      {(vendors || []).map((v: Vendor) => (
        <View key={v.id} style={{
          backgroundColor: "#fff", padding: 14, borderRadius: 10,
          marginBottom: 8, borderWidth: 1, borderColor: "#e5e7eb",
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>{v.name}</Text>
            <View style={{
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
              backgroundColor: (v.status === "active" ? "#10b981" : "#6b7280") + "20",
            }}>
              <Text style={{
                fontSize: 11, fontWeight: "600",
                color: v.status === "active" ? "#10b981" : "#6b7280",
                textTransform: "capitalize",
              }}>{v.status}</Text>
            </View>
          </View>
          {v.email && <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{v.email}</Text>}
          {v.phone && <Text style={{ fontSize: 13, color: "#6b7280" }}>{v.phone}</Text>}
          <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Code: {v.code} · {v.city || "—"}</Text>
        </View>
      ))}

      <Modal visible={showCreate} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#111827" }}>New Vendor</Text>

            <TextInput style={inputStyle} placeholder="Vendor name *" value={name} onChangeText={setName} />
            <TextInput style={inputStyle} placeholder="Code *" value={code} onChangeText={setCode} />
            <TextInput style={inputStyle} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <TextInput style={inputStyle} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <TouchableOpacity onPress={() => setShowCreate(false)} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: "#f3f4f6", alignItems: "center" }}>
                <Text style={{ fontWeight: "600", color: "#374151" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCreate} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: "#2563eb", alignItems: "center" }}>
                <Text style={{ fontWeight: "600", color: "#fff" }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function GRNList({ projectId }: { projectId: string }) {
  const { data: grns, isLoading, isError } = useGRNs(projectId);
  const confirmGRN = useConfirmGRN(projectId);
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (isError) return <Text style={{ color: "#ef4444", textAlign: "center", marginTop: 40 }}>Failed to load GRNs</Text>;

  return (
    <View>
      <TouchableOpacity
        onPress={() => setShowCreate(true)}
        style={{
          backgroundColor: "#2563eb", padding: 12, borderRadius: 8,
          alignItems: "center", marginBottom: 16,
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>+ New GRN</Text>
      </TouchableOpacity>

      {(!grns || grns.length === 0) && (
        <Text style={{ color: "#9ca3af", textAlign: "center", marginTop: 40 }}>No GRNs</Text>
      )}
      {(grns || []).map((g: GRN) => (
        <View key={g.id} style={{
          backgroundColor: "#fff", padding: 14, borderRadius: 10,
          marginBottom: 8, borderWidth: 1, borderColor: "#e5e7eb",
        }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>{g.grn_number}</Text>
            <View style={{
              paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
              backgroundColor: (g.status === "confirmed" ? "#10b981" : "#6b7280") + "20",
            }}>
              <Text style={{
                fontSize: 11, fontWeight: "600",
                color: g.status === "confirmed" ? "#10b981" : "#6b7280",
                textTransform: "capitalize",
              }}>{g.status}</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            Received: {g.received_date} {g.inspection_passed ? "· Inspection passed" : "· Inspection failed"}
          </Text>
          {g.status === "draft" && (
            <TouchableOpacity
              onPress={() => confirmGRN.mutate(g.id)}
              style={{ marginTop: 8, padding: 8, backgroundColor: "#10b981", borderRadius: 6, alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>Confirm Receipt</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <CreateGRNForm projectId={projectId} visible={showCreate} onClose={() => setShowCreate(false)} />
    </View>
  );
}

function CreateGRNForm({ projectId, visible, onClose }: { projectId: string; visible: boolean; onClose: () => void }) {
  const createGRN = useCreateGRN(projectId);
  const { data: pos } = usePurchaseOrders(projectId);
  const [poId, setPoId] = useState("");
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);

  const handleCreate = async () => {
    if (!poId) { Alert.alert("Error", "Please select a PO"); return; }
    try {
      await createGRN.mutateAsync({
        po_id: poId,
        received_date: receivedDate,
        items: [{ po_item_id: "", description: "Item", unit: "NOS", ordered_quantity: 0, received_quantity: 0, unit_rate: 0 }],
      });
      Alert.alert("Success", "GRN created");
      onClose();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to create GRN");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 16, color: "#111827" }}>New GRN</Text>

          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 4 }}>Purchase Order</Text>
          <ScrollView horizontal style={{ marginBottom: 12 }}>
            {(pos || []).map((po: PO) => (
              <TouchableOpacity
                key={po.id}
                onPress={() => setPoId(po.id)}
                style={{
                  padding: 10, borderRadius: 8, marginRight: 8,
                  backgroundColor: poId === po.id ? "#2563eb" : "#f3f4f6",
                }}
              >
                <Text style={{ color: poId === po.id ? "#fff" : "#374151", fontWeight: "600", fontSize: 13 }}>{po.po_number}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TextInput
            style={inputStyle}
            value={receivedDate} onChangeText={setReceivedDate}
            placeholder="Received date (YYYY-MM-DD)"
          />

          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <TouchableOpacity onPress={onClose} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: "#f3f4f6", alignItems: "center" }}>
              <Text style={{ fontWeight: "600", color: "#374151" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCreate} style={{ flex: 1, padding: 12, borderRadius: 8, backgroundColor: "#2563eb", alignItems: "center" }}>
              <Text style={{ fontWeight: "600", color: "#fff" }}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const inputStyle = {
  borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8,
  padding: 10, marginBottom: 12, fontSize: 14,
};
