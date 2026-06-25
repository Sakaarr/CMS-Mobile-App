import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/src/lib/api";

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  author_name: string | null;
  author_avatar: string | null;
  target_type: string;
  target_id: string;
  parent_id: string | null;
  replies: Comment[];
  created_at: string;
  updated_at: string;
}

export interface CommentListResponse {
  total: number;
  data: Comment[];
}

export function useComments(targetType: string, targetId: string) {
  return useQuery({
    queryKey: ["comments", targetType, targetId],
    queryFn: async () => {
      const res = await apiClient.get(`/comments/${targetType}/${targetId}`);
      return res.data.data as CommentListResponse;
    },
    enabled: !!targetType && !!targetId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      content: string; target_type: string; target_id: string; parent_id?: string;
    }) => apiClient.post("/comments", data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.target_type, vars.target_id] });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, targetType, targetId }: { commentId: string; targetType: string; targetId: string }) =>
      apiClient.delete(`/comments/${commentId}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["comments", vars.targetType, vars.targetId] });
    },
  });
}
