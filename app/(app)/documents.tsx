import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator,
  TextInput, Linking, Alert,
} from "react-native";
import { useState } from "react";
import { useProjects } from "@/src/hooks/useProjects";
import { useDocuments, useDocumentSummary } from "@/src/hooks/useDocuments";

const CATEGORY_EMOJI: Record<string, string> = {
  drawing: "📐",
  contract: "📜",
  specification: "📋",
  report: "📊",
  photo: "📷",
  certificate: "🏆",
  permit: "✅",
  invoice: "🧾",
  rfi: "❓",
  submittal: "📤",
  meeting_minutes: "📝",
  other: "📄",
};

const STATUS_COLORS: Record<string, [string, string]> = {
  draft: ["#f3f4f6", "#4b5563"],
  under_review: ["#dbeafe", "#1d4ed8"],
  approved: ["#dcfce7", "#16a34a"],
  rejected: ["#fee2e2", "#dc2626"],
  superseded: ["#f3f4f6", "#9ca3af"],
  archived: ["#f3f4f6", "#9ca3af"],
};

export default function DocumentsScreen() {
  const { data: projects } = useProjects();
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [step, setStep] = useState<"select" | "list">("select");

  if (step === "select") {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Documents</Text>
        <Text style={styles.sub}>Select project to browse files</Text>
        {projects?.filter((p: any) => p.status === "active").map((p: any) => (
          <TouchableOpacity
            key={p.id}
            style={styles.projectCard}
            onPress={() => {
              setSelectedProject(p);
              setStep("list");
            }}
          >
            <Text style={styles.projectName}>{p.name}</Text>
            <Text style={styles.projectCode}>{p.code}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  return (
    <DocumentList
      project={selectedProject}
      search={search}
      setSearch={setSearch}
      onBack={() => { setStep("select"); setSelectedProject(null); }}
    />
  );
}

function DocumentList({ project, search, setSearch, onBack }: {
  project: any;
  search: string;
  setSearch: (s: string) => void;
  onBack: () => void;
}) {
  const { data: docsData, isLoading } = useDocuments(project.id, {
    search: search || undefined,
  });
  const { data: summary } = useDocumentSummary(project.id);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);

  const documents = docsData?.data ?? [];

  if (selectedDoc) {
    return <DocumentDetail doc={selectedDoc} onBack={() => setSelectedDoc(null)} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backRow}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{project.name}</Text>
        <Text style={styles.sub}>Documents & drawings</Text>
      </View>

      {/* Summary strip */}
      {summary && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.summaryScroll}
          contentContainerStyle={styles.summaryContainer}
        >
          <View style={styles.summaryChip}>
            <Text style={styles.summaryVal}>{summary.total_documents}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={[styles.summaryVal, { color: "#7c3aed" }]}>
              {summary.by_category?.drawing ?? 0}
            </Text>
            <Text style={styles.summaryLabel}>Drawings</Text>
          </View>
          <View style={styles.summaryChip}>
            <Text style={[styles.summaryVal, { color: "#2563eb" }]}>
              {summary.by_category?.contract ?? 0}
            </Text>
            <Text style={styles.summaryLabel}>Contracts</Text>
          </View>
          {summary.pending_approvals > 0 && (
            <View style={[styles.summaryChip, styles.summaryChipAlert]}>
              <Text style={[styles.summaryVal, { color: "#d97706" }]}>
                {summary.pending_approvals}
              </Text>
              <Text style={[styles.summaryLabel, { color: "#92400e" }]}>Pending</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="Search documents..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color="#2563eb" />
        ) : !documents.length ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📂</Text>
            <Text style={styles.emptyText}>No documents yet</Text>
          </View>
        ) : documents.map((doc: any) => {
          const [bg, fg] = STATUS_COLORS[doc.status] ?? ["#f3f4f6", "#4b5563"];
          return (
            <TouchableOpacity
              key={doc.id}
              style={styles.docCard}
              onPress={() => setSelectedDoc(doc)}
            >
              <View style={styles.docIcon}>
                <Text style={styles.docEmoji}>
                  {CATEGORY_EMOJI[doc.category] ?? "📄"}
                </Text>
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docTitle} numberOfLines={1}>
                  {doc.title}
                </Text>
                <Text style={styles.docMeta}>
                  {doc.document_number}
                  {doc.drawing_number ? ` · ${doc.drawing_number}` : ""}
                  {doc.discipline ? ` · ${doc.discipline}` : ""}
                </Text>
              </View>
              <View style={styles.docRight}>
                <View style={[styles.statusBadge, { backgroundColor: bg }]}>
                  <Text style={[styles.statusText, { color: fg }]}>
                    {doc.status.replace(/_/g, " ")}
                  </Text>
                </View>
                <Text style={styles.docVersion}>v{doc.version}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function DocumentDetail({ doc, onBack }: { doc: any; onBack: () => void }) {
  const handleOpen = async () => {
    if (doc.file_url) {
      const canOpen = await Linking.canOpenURL(doc.file_url);
      if (canOpen) {
        await Linking.openURL(doc.file_url);
      } else {
        Alert.alert("Error", "Cannot open this file URL");
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={onBack} style={styles.backRowInner}>
        <Text style={styles.backText}>← Documents</Text>
      </TouchableOpacity>

      <View style={styles.detailHeader}>
        <Text style={styles.detailEmoji}>
          {CATEGORY_EMOJI[doc.category] ?? "📄"}
        </Text>
        <Text style={styles.detailTitle}>{doc.title}</Text>
        <Text style={styles.detailNumber}>{doc.document_number}</Text>
      </View>

      {/* Details grid */}
      <View style={styles.detailGrid}>
        {[
          ["Category", doc.category?.replace(/_/g, " ")],
          ["Version", `v${doc.version}`],
          ["Status", doc.status?.replace(/_/g, " ")],
          ["Discipline", doc.discipline ?? "—"],
          ["Drawing no.", doc.drawing_number ?? "—"],
          ["File type", doc.file_type?.toUpperCase() ?? "—"],
          ["File name", doc.file_name],
          ["Uploaded", doc.created_at?.slice(0, 10)],
        ].map(([label, value]) => (
          <View key={label} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
          </View>
        ))}
      </View>

      {/* Description */}
      {doc.description && (
        <View style={styles.descCard}>
          <Text style={styles.descTitle}>Description</Text>
          <Text style={styles.descText}>{doc.description}</Text>
        </View>
      )}

      {/* Tags */}
      {doc.tags && (
        <View style={styles.tagsWrap}>
          {doc.tags.split(",").map((tag: string) => (
            <View key={tag.trim()} style={styles.tag}>
              <Text style={styles.tagText}>{tag.trim()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Approvals */}
      {doc.approvals?.length > 0 && (
        <View style={styles.approvalsSection}>
          <Text style={styles.sectionLabel}>Approvals</Text>
          {doc.approvals.map((a: any) => {
            const statusColor = a.status === "approved"
              ? "#10b981"
              : a.status === "rejected"
              ? "#ef4444"
              : "#f59e0b";
            return (
              <View key={a.id} style={styles.approvalRow}>
                <View style={[styles.approvalDot, { backgroundColor: statusColor }]} />
                <View style={styles.approvalInfo}>
                  <Text style={styles.approvalName}>{a.approver_name}</Text>
                  {a.comments && (
                    <Text style={styles.approvalComment}>{a.comments}</Text>
                  )}
                </View>
                <Text style={[styles.approvalStatus, { color: statusColor }]}>
                  {a.status}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Open button */}
      <TouchableOpacity style={styles.openBtn} onPress={handleOpen}>
        <Text style={styles.openBtnText}>📎 Open file</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// Mobile Documents hook
// export function useDocuments(projectId: string, params?: { search?: string; category?: string }) {
//   const { useQuery } = require("@tanstack/react-query");
//   const { apiClient } = require("@/src/lib/api");
//   return useQuery({
//     queryKey: ["documents", projectId, params],
//     queryFn: async () => {
//       const p = new URLSearchParams();
//       if (params?.search) p.set("search", params.search);
//       if (params?.category) p.set("category", params.category);
//       const res = await apiClient.get(`/projects/${projectId}/documents?${p}`);
//       return res.data;
//     },
//     enabled: !!projectId,
//   });
// }

// export function useDocumentSummary(projectId: string) {
//   const { useQuery } = require("@tanstack/react-query");
//   const { apiClient } = require("@/src/lib/api");
//   return useQuery({
//     queryKey: ["document-summary", projectId],
//     queryFn: async () => {
//       const res = await apiClient.get(`/projects/${projectId}/document-summary`);
//       return res.data.data;
//     },
//     enabled: !!projectId,
//   });
// }

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 20, paddingBottom: 40 },
  header: { backgroundColor: "#fff", padding: 16, borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  backRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backRowInner: { marginBottom: 16 },
  backText: { color: "#2563eb", fontSize: 14 },
  title: { fontSize: 20, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  summaryScroll: { backgroundColor: "#fff", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb", flexGrow: 0 },
  summaryContainer: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  summaryChip: {
    backgroundColor: "#f8fafc", borderRadius: 10, padding: 10,
    alignItems: "center", minWidth: 70, borderWidth: 0.5, borderColor: "#e5e7eb",
  },
  summaryChipAlert: { backgroundColor: "#fffbeb", borderColor: "#fcd34d" },
  summaryVal: { fontSize: 18, fontWeight: "700", color: "#111827" },
  summaryLabel: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
  searchWrap: { padding: 12, backgroundColor: "#fff", borderBottomWidth: 0.5, borderBottomColor: "#e5e7eb" },
  search: {
    backgroundColor: "#f9fafb", borderRadius: 10, height: 40,
    paddingHorizontal: 14, fontSize: 14, color: "#111827",
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  list: { flex: 1 },
  listContent: { padding: 12 },
  emptyState: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: "#9ca3af" },
  docCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 8,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 0.5, borderColor: "#e5e7eb",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  docIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "#f3f4f6", alignItems: "center", justifyContent: "center",
  },
  docEmoji: { fontSize: 20 },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  docMeta: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  docRight: { alignItems: "flex-end", gap: 4 },
  statusBadge: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: "600", textTransform: "capitalize" },
  docVersion: { fontSize: 10, color: "#9ca3af", fontFamily: "monospace" },
  projectCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 8,
    borderLeftWidth: 4, borderLeftColor: "#2563eb",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  projectName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  projectCode: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  detailHeader: { alignItems: "center", marginBottom: 20 },
  detailEmoji: { fontSize: 48, marginBottom: 8 },
  detailTitle: { fontSize: 18, fontWeight: "700", color: "#111827", textAlign: "center" },
  detailNumber: { fontSize: 12, color: "#9ca3af", marginTop: 4, fontFamily: "monospace" },
  detailGrid: {
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 0.5, borderColor: "#e5e7eb", overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 0.5, borderBottomColor: "#f3f4f6",
  },
  detailLabel: { fontSize: 13, color: "#6b7280" },
  detailValue: {
    fontSize: 13, fontWeight: "500", color: "#111827",
    textTransform: "capitalize", maxWidth: "55%", textAlign: "right",
  },
  descCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    marginTop: 12, borderWidth: 0.5, borderColor: "#e5e7eb",
  },
  descTitle: { fontSize: 12, fontWeight: "600", color: "#9ca3af", marginBottom: 6, textTransform: "uppercase" },
  descText: { fontSize: 14, color: "#374151", lineHeight: 20 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  tag: { backgroundColor: "#eff6ff", borderRadius: 99, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 11, color: "#1d4ed8" },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.8, marginTop: 16, marginBottom: 8 },
  approvalsSection: { marginTop: 4 },
  approvalRow: {
    backgroundColor: "#fff", borderRadius: 10, padding: 12,
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6,
    borderWidth: 0.5, borderColor: "#e5e7eb",
  },
  approvalDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  approvalInfo: { flex: 1 },
  approvalName: { fontSize: 13, fontWeight: "500", color: "#111827" },
  approvalComment: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  approvalStatus: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  openBtn: {
    backgroundColor: "#2563eb", borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginTop: 20,
  },
  openBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});