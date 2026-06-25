import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { useState } from "react";
import { useComments, useCreateComment, useDeleteComment } from "@/src/hooks/useComments";

interface CommentSectionProps {
  targetType: string;
  targetId: string;
}

export function CommentSection({ targetType, targetId }: CommentSectionProps) {
  const { data, isLoading } = useComments(targetType, targetId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const comments = data?.data ?? [];

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await createComment.mutateAsync({ content: newComment, target_type: targetType, target_id: targetId });
      setNewComment("");
    } catch {
      Alert.alert("Error", "Failed to post comment");
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    try {
      await createComment.mutateAsync({
        content: replyText, target_type: targetType, target_id: targetId, parent_id: parentId,
      });
      setReplyTo(null);
      setReplyText("");
    } catch {
      Alert.alert("Error", "Failed to post reply");
    }
  };

  const handleDelete = (commentId: string) => {
    Alert.alert("Delete comment", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => deleteComment.mutate({ commentId, targetType, targetId }),
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Comments ({data?.total ?? 0})</Text>

        {isLoading ? (
          <ActivityIndicator style={{ marginTop: 20 }} />
        ) : comments.length === 0 ? (
          <Text style={styles.empty}>No comments yet. Start the conversation.</Text>
        ) : (
          comments.map((comment: any) => (
            <View key={comment.id} style={styles.commentWrap}>
              <View style={styles.commentRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(comment.author_name || "?").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.commentBody}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.authorName}>{comment.author_name || "Unknown"}</Text>
                    <Text style={styles.timeAgo}>
                      {new Date(comment.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.commentText}>{comment.content}</Text>
                  <View style={styles.commentActions}>
                    <TouchableOpacity onPress={() => setReplyTo(replyTo === comment.id ? null : comment.id)}>
                      <Text style={styles.actionBtn}>Reply</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(comment.id)}>
                      <Text style={[styles.actionBtn, { color: "#ef4444" }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  {replyTo === comment.id && (
                    <View style={styles.replyInputRow}>
                      <TextInput
                        style={styles.replyInput}
                        placeholder="Write a reply..."
                        value={replyText}
                        onChangeText={setReplyText}
                      />
                      <TouchableOpacity
                        style={styles.replyBtn}
                        onPress={() => handleReply(comment.id)}
                        disabled={!replyText.trim()}
                      >
                        <Text style={styles.replyBtnText}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {comment.replies?.length > 0 && (
                    <View style={styles.repliesSection}>
                      {comment.replies.map((reply: any) => (
                        <View key={reply.id} style={styles.replyRow}>
                          <View style={[styles.avatar, styles.replyAvatar]}>
                            <Text style={styles.replyAvatarText}>
                              {(reply.author_name || "?").slice(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          <View style={styles.replyBody}>
                            <Text style={styles.replyAuthor}>{reply.author_name || "Unknown"}</Text>
                            <Text style={styles.replyText}>{reply.content}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment..."
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !newComment.trim() && styles.sendBtnDisabled]}
          onPress={handleSubmit}
          disabled={!newComment.trim()}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 16, fontWeight: "600", color: "#111827", marginBottom: 16 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 24 },
  commentWrap: { marginBottom: 16 },
  commentRow: { flexDirection: "row", gap: 10 },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "#dbeafe", alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 11, fontWeight: "600", color: "#2563eb" },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  authorName: { fontSize: 13, fontWeight: "600", color: "#111827" },
  timeAgo: { fontSize: 11, color: "#9ca3af" },
  commentText: { fontSize: 14, color: "#374151", marginTop: 2, lineHeight: 20 },
  commentActions: { flexDirection: "row", gap: 12, marginTop: 6 },
  actionBtn: { fontSize: 12, color: "#2563eb" },
  replyInputRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  replyInput: {
    flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6, fontSize: 13, backgroundColor: "#fff",
  },
  replyBtn: {
    backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 12,
    justifyContent: "center",
  },
  replyBtnText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  repliesSection: {
    borderLeftWidth: 2, borderLeftColor: "#e5e7eb",
    paddingLeft: 12, marginTop: 8, gap: 10,
  },
  replyRow: { flexDirection: "row", gap: 8 },
  replyAvatar: { width: 24, height: 24, borderRadius: 12 },
  replyAvatarText: { fontSize: 9, fontWeight: "600", color: "#6b7280" },
  replyBody: { flex: 1 },
  replyAuthor: { fontSize: 12, fontWeight: "600", color: "#111827" },
  replyText: { fontSize: 13, color: "#374151", marginTop: 1 },
  inputBar: {
    flexDirection: "row", padding: 12, backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: "#e5e7eb", gap: 8,
    position: "absolute", bottom: 0, left: 0, right: 0,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, maxHeight: 60,
    backgroundColor: "#f9fafb",
  },
  sendBtn: {
    backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 16,
    justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendBtnText: { color: "#fff", fontSize: 14, fontWeight: "600" },
});
