import {
  Badge,
  Button,
  Flex,
  Heading,
  Text,
  Textarea,
  VStack,
  Separator,
  HStack,
  Box,
  Spinner,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { FaRegMessage } from "react-icons/fa6"
import { IoCalendarOutline, IoPersonOutline, IoAttachOutline, IoCloudUploadOutline, IoTrashOutline } from "react-icons/io5"

import {
  type CommentCreate,
  type TaskPublic,
  CommentsService,
  AttachmentsService,
} from "../../client" // Relative import for safety
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer"
// import { Avatar } from "../ui/avatar"
import { toaster } from "../ui/toaster"


interface TaskDetailsProps {
  task: TaskPublic
  children?: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (details: { open: boolean }) => void
}

export default function TaskDetails({ task, children, isOpen: controlledIsOpen, onOpenChange: controlledOnOpenChange }: TaskDetailsProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)

  const isControlled = controlledIsOpen !== undefined
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen
  const onOpenChange = isControlled ? (controlledOnOpenChange || (() => {})) : (e: { open: boolean }) => setInternalIsOpen(e.open)
  const queryClient = useQueryClient()

  // Comments Query
  const { data: commentsData, isLoading: isLoadingComments } = useQuery({
    queryKey: ["comments", task.id],
    queryFn: () => CommentsService.readComments({ taskId: task.id }),
    enabled: isOpen,
  })

  // Attachments Query
  const { data: attachmentsData, isLoading: isLoadingAttachments } = useQuery({
    queryKey: ["attachments", task.id],
    queryFn: () => AttachmentsService.readAttachments({ taskId: task.id }),
    enabled: isOpen,
  })

  // Upload Attachment Mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: (file: File) =>
      AttachmentsService.createAttachment({ 
          taskId: task.id, 
          formData: { file } 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments", task.id] })
      toaster.create({ title: "Attachment uploaded", type: "success" })
    },
    onError: () => {
      toaster.create({ title: "Failed to upload attachment", type: "error" })
    }
  })

  // Delete Attachment Mutation
  const deleteAttachmentMutation = useMutation({
    mutationFn: (id: string) => AttachmentsService.deleteAttachment({ id }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["attachments", task.id] })
        toaster.create({ title: "Attachment deleted", type: "success" })
    }
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      uploadAttachmentMutation.mutate(file)
  }

  const handleDownload = async (id: string) => {
      try {
          const res = await AttachmentsService.getAttachmentUrl({ id })
          if (res.message) {
              window.open(res.message, "_blank")
          }
      } catch (e) {
          toaster.create({ title: "Failed to get download URL", type: "error" })
      }
  }

  // Add Comment Mutation
  const addCommentMutation = useMutation({
    mutationFn: (data: CommentCreate) =>
      CommentsService.createComment({ requestBody: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", task.id] })
      reset()
      toaster.create({
          title: "Comment added",
          type: "success"
      })
    },
    onError: () => { // Use explicit ignore if unused, but toaster uses nothing?
         toaster.create({
          title: "Failed to add comment",
          type: "error"
      })
    }
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<CommentCreate>({
    defaultValues: {
      content: "",
      task_id: task.id,
    },
  })

  const onSubmit = (data: CommentCreate) => {
    addCommentMutation.mutate({ ...data, task_id: task.id })
  }

  // Format Status for display
  const statusColors: Record<string, string> = {
    todo: "gray",
    in_progress: "blue",
    done: "green",
    re_opened: "orange",
  }

  const statusLabel = (status: string) => {
      if (status === "re_opened") return "Re-opened"
      return status.replace("_", " ").replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <DrawerRoot open={isOpen} onOpenChange={onOpenChange} size="md">
      <DrawerBackdrop />
      {children && <DrawerTrigger asChild>{children}</DrawerTrigger>}
      <DrawerContent>
        <DrawerHeader>
          <Flex justify="space-between" align="center" width="full">
             <VStack align="flex-start" gap={1}>
                <DrawerTitle fontSize="xl">{task.title}</DrawerTitle>
                <HStack>
                    <Badge colorPalette={statusColors[task.status] || "gray"}>
                         {statusLabel(task.status)}
                    </Badge>
                     <Badge variant="outline" colorPalette={task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'yellow' : 'blue'}>
                        {task.priority || "No Priority"}
                    </Badge>
                </HStack>
             </VStack>
          </Flex>
          <DrawerCloseTrigger />
        </DrawerHeader>

        <DrawerBody>
          <VStack align="stretch" gap={6}>
            
            {/* Description */}
            <Box>
                <Text fontWeight="medium" mb={2}>Description</Text>
                <Text color={task.description ? "inherit" : "gray.400"}>
                    {task.description || "No description provided."}
                </Text>
            </Box>

            <Separator />

            {/* Meta Data */}
            <Flex gap={6}>
                <VStack align="flex-start" gap={1}>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold">ASSIGNEE</Text>
                    <HStack>
                        <IoPersonOutline />
                         <Text fontSize="sm">{task.assignee_id ? "Assigned" : "Unassigned"}</Text>
                    </HStack>
                </VStack>
                
                 <VStack align="flex-start" gap={1}>
                    <Text fontSize="xs" color="gray.500" fontWeight="bold">DUE DATE</Text>
                    <HStack>
                        <IoCalendarOutline />
                         <Text fontSize="sm">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "No Due Date"}</Text>
                    </HStack>
                </VStack>
            </Flex>

            <Separator />

             {/* Attachments Section */}
             <Box>
                <HStack mb={4} justify="space-between">
                    <HStack>
                        <IoAttachOutline />
                        <Heading size="sm">Attachments</Heading>
                    </HStack>
                    <Button size="xs" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                        <IoCloudUploadOutline /> Upload
                    </Button>
                    <input 
                        type="file" 
                        id="file-upload" 
                        style={{ display: 'none' }} 
                        onChange={handleFileUpload}
                    />
                </HStack>

                <Flex direction="column" gap={2} mb={4}>
                    {isLoadingAttachments ? (
                        <Spinner size="sm" />
                    ) : attachmentsData?.data.length === 0 ? (
                        <Text fontSize="sm" color="gray.500" fontStyle="italic">No attachments.</Text>
                    ) : (
                        attachmentsData?.data.map((att: any) => (
                             <Flex key={att.id} justify="space-between" align="center" bg="gray.50" p={2} rounded="md" borderWidth="1px" borderColor="gray.200">
                                <HStack gap={3} onClick={() => handleDownload(att.id)} cursor="pointer" flex="1">
                                    <IoAttachOutline color="gray" />
                                    <VStack align="flex-start" gap={0}>
                                        <Text fontSize="sm" fontWeight="medium" lineClamp={1}>{att.file_name}</Text>
                                        <Text fontSize="xs" color="gray.400">{(att.file_size / 1024).toFixed(1)} KB</Text>
                                    </VStack>
                                </HStack>
                                <Button 
                                    size="xs" 
                                    variant="ghost" 
                                    colorPalette="red"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        if(confirm("Delete attachment?")) deleteAttachmentMutation.mutate(att.id)
                                    }}
                                >
                                    <IoTrashOutline />
                                </Button>
                             </Flex>
                        ))
                    )}
                </Flex>
             </Box>
            
            <Separator />

            {/* Comments Section */}
            <Box>
                <HStack mb={4}>
                    <FaRegMessage />
                    <Heading size="sm">Comments</Heading>
                </HStack>
                
                <Flex direction="column" gap={4} mb={4}>
                    {isLoadingComments ? (
                        <Spinner size="sm" />
                    ) : commentsData?.data.length === 0 ? (
                        <Text fontSize="sm" color="gray.500" fontStyle="italic">No comments yet.</Text>
                    ) : (
                        commentsData?.data.map((comment: any) => (
                             <Box key={comment.id} bg="gray.50" p={3} rounded="md">
                                <HStack mb={1} justify="space-between">
                                    <Text fontWeight="medium" fontSize="xs">User {comment.user_id.substring(0,4)}...</Text>
                                    <Text fontSize="xs" color="gray.400">{new Date(comment.created_at).toLocaleString()}</Text>
                                </HStack>
                                <Text fontSize="sm">{comment.content}</Text>
                             </Box>
                        ))
                    )}
                </Flex>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <VStack align="stretch">
                        <Textarea 
                            placeholder="Write a comment..." 
                            size="sm" 
                            resize="vertical"
                            {...register("content", { required: true })}
                        />
                        <Button type="submit" size="sm" alignSelf="flex-end" loading={isSubmitting}>
                            Comment
                        </Button>
                    </VStack>
                </form>

            </Box>

          </VStack>
        </DrawerBody>
        <DrawerFooter>
          {/* Optional actions like Delete Task */}
        </DrawerFooter>
      </DrawerContent>
    </DrawerRoot>
  )
}
