import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
} from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { type SubmitHandler, useForm } from "react-hook-form"

import { type InvitationCreate, InvitationsService } from "@/client"
import type { ApiError } from "@/client/core/ApiError"
import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
} from "../ui/dialog"
import { Field } from "../ui/field"

interface InviteMemberProps {
    workspaceId: string
    isOpen: boolean
    onOpenChange: (details: { open: boolean }) => void
}

const InviteMember = ({ workspaceId, isOpen, onOpenChange }: InviteMemberProps) => {
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<InvitationCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      workspace_id: workspaceId,
      role: "member",
    },
  })

  // Update form workspace_id if prop changes (though re-mount usually handles this)
  const mutation = useMutation({
    mutationFn: (data: InvitationCreate) =>
      InvitationsService.createInvitation({ requestBody: { ...data, workspace_id: workspaceId } }),
    onSuccess: () => {
      showSuccessToast("Invitation sent successfully.")
      reset()
      onOpenChange({ open: false })
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
  })

  const onSubmit: SubmitHandler<InvitationCreate> = (data) => {
    mutation.mutate(data)
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>
              Invite a new member to join this workspace. They will receive an email with a link to join.
            </Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.email}
                errorText={errors.email?.message}
                label="Email"
              >
                <Input
                  {...register("email", {
                    required: "Email is required.",
                    pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                    }
                  })}
                  placeholder="Email Address"
                  type="email"
                />
              </Field>
            </VStack>
          </DialogBody>

          <DialogFooter gap={2}>
            <DialogActionTrigger asChild>
              <Button
                variant="subtle"
                colorPalette="gray"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </DialogActionTrigger>
            <Button
              variant="solid"
              type="submit"
              disabled={!isValid}
              loading={isSubmitting}
            >
              Send Invitation
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default InviteMember
