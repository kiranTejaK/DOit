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
import { IoCalendarOutline, IoPersonOutline, IoAttachOutline, IoTrashOutline } from "react-icons/io5"

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
  const { data: attachmentsData } = useQuery({
    queryKey: ["attachments", task.id],
    queryFn: () => AttachmentsService.readAttachments({ taskId: task.id }),
    enabled: isOpen,
  })

  const deleteAttachmentMutation = useMutation({
    mutationFn: (id: string) => AttachmentsService.deleteAttachment({ id }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["attachments", task.id] })
        toaster.create({ title: "Attachment deleted", type: "success" })
    }
  })

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
      setPendingAttachments([])
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

    const [pendingAttachments, setPendingAttachments] = useState<any[]>([])

    const uploadCommentAttachmentMutation = useMutation({
        mutationFn: (file: File) =>
          AttachmentsService.createAttachment({ 
              taskId: task.id, 
              formData: { file } 
          }),
        onSuccess: (data) => {
          setPendingAttachments(prev => [...prev, data])
          toaster.create({ title: "File attached", type: "success" })
        },
        onError: (err: any) => {
          const errorDetail = err.body?.detail || err.message || "Failed to upload"
          toaster.create({ title: "Failed to upload", description: errorDetail, type: "error" })
        }
    })

    const handleCommentFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        uploadCommentAttachmentMutation.mutate(file)
    }

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
        // Include pending attachments IDs
        const attachmentIds = pendingAttachments.map(att => att.id)
        
        // Cast data to any to allow extra fields (or update interface if possible, but cast is quicker for fix)
        const payload: any = { ...data, task_id: task.id }
        if (attachmentIds.length > 0) {
            payload.attachment_ids = attachmentIds
        }
        
        addCommentMutation.mutate(payload)
    }
    
    // I need to replace the existing useForm logic block.
    // Let's locate the existing useForm block and onSubmit.

    // ...


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

  // Group attachments
  const standaloneAttachments = attachmentsData?.data.filter((a: any) => !a.comment_id) || []
  const attachmentsByComment = (attachmentsData?.data || []).reduce((acc: any, att: any) => {
      if (att.comment_id) {
          if (!acc[att.comment_id]) acc[att.comment_id] = []
          acc[att.comment_id].push(att)
      }
      return acc
  }, {} as Record<string, any[]>)

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

             {/* Standalone Attachments Section */}
             {standaloneAttachments.length > 0 && (
                <Box>
                    <HStack mb={4} justify="space-between">
                        <HStack>
                            <IoAttachOutline />
                            <Heading size="sm">Task Attachments</Heading>
                        </HStack>
                    </HStack>

                    <Flex direction="column" gap={2} mb={4}>
                         {standaloneAttachments.map((att: any) => (
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
                        }
                    </Flex>
                     <Separator />
                 </Box>
             )}
            
            {/* Comments Section */}
            <Box>
                <HStack mb={4}>
                    <FaRegMessage />
                    <Heading size="sm">Comments</Heading>
                </HStack>
                
                <Flex direction="column" gap={6} mb={6}>
                    {isLoadingComments ? (
                        <Spinner size="sm" />
                    ) : commentsData?.data.length === 0 ? (
                        <Text fontSize="sm" color="gray.500" fontStyle="italic">No comments yet.</Text>
                    ) : (
                        commentsData?.data.map((comment: any) => (
                             <Box 
                                key={comment.id} 
                                bg={{ base: "gray.50", _dark: "gray.700" }} 
                                p={3} 
                                rounded="md" 
                                border="1px solid" 
                                borderColor={{ base: "gray.100", _dark: "gray.700" }}
                             >
                                <HStack mb={2} justify="space-between">
                                    <HStack gap={2}>
                                        <Box bg="blue.500" w={6} h={6} rounded="full" display="flex" alignItems="center" justifyContent="center">
                                            <IoPersonOutline color="white" size="12px" />
                                        </Box>
                                        <Text fontWeight="medium" fontSize="sm">{comment.user_full_name || `User ${comment.user_id.substring(0,4)}...`}</Text>
                                    </HStack>
                                    <Text fontSize="xs" color="gray.400">{new Date(comment.created_at).toLocaleString()}</Text>
                                </HStack>
                                <Text fontSize="sm" whiteSpace="pre-wrap" mb={2}>{comment.content}</Text>
                                
                                {/* Comment Attachments (Ladder View) */}
                                {attachmentsByComment[comment.id]?.length > 0 && (
                                    <Flex gap={2} mt={3} wrap="wrap">
                                        {attachmentsByComment[comment.id].map((att: any) => (
                                            <Box 
                                                key={att.id} 
                                                border="1px solid" 
                                                borderColor={{ base: "gray.200", _dark: "gray.600" }}
                                                bg={{ base: "white", _dark: "gray.800" }}
                                                p={2} 
                                                rounded="md" 
                                                cursor="pointer" 
                                                onClick={() => handleDownload(att.id)} 
                                                _hover={{ borderColor: "blue.300", shadow: "sm" }}
                                                maxW="200px"
                                            >
                                                <HStack gap={2}>
                                                    <Box bg={{ base: "gray.100", _dark: "gray.600" }} p={1} rounded="sm">
                                                        <IoAttachOutline color="gray" />
                                                    </Box>
                                                    <VStack align="start" gap={0} flex="1" overflow="hidden">
                                                        <Text fontSize="xs" fontWeight="medium" lineClamp={1} w="full" textOverflow="ellipsis">{att.file_name}</Text>
                                                        <Text fontSize="xx-small" color="gray.400">{(att.file_size / 1024).toFixed(0)} KB</Text>
                                                    </VStack>
                                                </HStack>
                                            </Box>
                                        ))}
                                    </Flex>
                                )}
                             </Box>
                        ))
                    )}
                </Flex>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <VStack align="stretch" gap={3}>
                        <Textarea 
                            placeholder="Write a comment..." 
                            size="sm" 
                            resize="vertical"
                            rows={3}
                            onKeyDown={(e) => e.stopPropagation()}
                            {...register("content", { required: true })}
                        />
                        
                         {/* Pending Attachments List */}
                         {pendingAttachments.length > 0 && (
                            <Flex gap={2} wrap="wrap">
                                {pendingAttachments.map(att => (
                                    <Badge key={att.id} variant="subtle" colorPalette="blue" size="sm" p={1} px={2}>
                                        <HStack gap={1}>
                                            <IoAttachOutline />
                                            {att.file_name}
                                            <Box 
                                                as="button" 
                                                fontSize="xs" 
                                                cursor="pointer"
                                                ml={1}
                                                onClick={() => setPendingAttachments(prev => prev.filter(p => p.id !== att.id))}
                                                _hover={{ color: "red.500" }}
                                            >
                                                x
                                            </Box>
                                        </HStack>
                                    </Badge>
                                ))}
                            </Flex>
                        )}
                        
                        <HStack justify="space-between">
                            <Box>
                                <Button 
                                    size="xs" 
                                    variant="outline" 
                                    onClick={() => document.getElementById('comment-file-upload')?.click()}
                                    loading={uploadCommentAttachmentMutation.isPending}
                                    type="button"
                                >
                                    <IoAttachOutline /> Attach File
                                </Button>
                                <input 
                                    type="file" 
                                    id="comment-file-upload" 
                                    style={{ display: 'none' }} 
                                    onChange={handleCommentFileSelect}
                                />
                            </Box>
                            
                            <Button 
                                type="submit" 
                                size="sm" 
                                loading={addCommentMutation.isPending || isSubmitting}
                            >
                                Comment
                            </Button>
                        </HStack>
                    </VStack>
                </form>

            </Box>

          </VStack>
        </DrawerBody>
        <DrawerFooter />
      </DrawerContent>
    </DrawerRoot>
  )
}
