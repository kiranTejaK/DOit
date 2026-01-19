import {
  Button,
  DialogActionTrigger,
  DialogTitle,
  Input,
  Text,
  VStack,
  createListCollection,
} from "@chakra-ui/react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Controller, type SubmitHandler, useForm, useWatch } from "react-hook-form"
import { FaPlus } from "react-icons/fa" // Uncommented now that imports work

import { TasksService } from "../../client/TasksService"
import { ProjectsService } from "../../client/ProjectsService"
import { WorkspacesService } from "../../client/WorkspacesService"
import { type ApiError } from "../../client/core/ApiError"

import useCustomToast from "@/hooks/useCustomToast"
import { handleError } from "@/utils"
import {
  DialogBody,
  DialogCloseTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogRoot,
  DialogTrigger,
} from "../ui/dialog"
import { Field } from "../ui/field"
import {
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectRoot,
  SelectTrigger,
  SelectValueText,
} from "../ui/select"

interface AddTaskProps {
    projectId?: string
    sectionId?: string
    onSuccess?: () => void
}

const AddTask = ({ projectId, sectionId, onSuccess }: AddTaskProps = {}) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()
  const { showSuccessToast } = useCustomToast()
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<any>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      title: "",
      description: "",
      project_id: projectId || "",
      section_id: sectionId || "", // Used in default values
      status: "todo",
      priority: "medium",
    },
  })

  // Fetch projects for selection
  const { data: projectsData } = useQuery({
    queryKey: ["projects"],
    queryFn: () => ProjectsService.readProjects({ limit: 100 }),
  })

  const projects = projectsData?.data || []
  
  // Watch project_id to fetch relevant members
  const projectIdValue = useWatch({ control, name: "project_id" })
  const selectedProject = projects.find(p => p.id === projectIdValue)
  const workspaceId = selectedProject?.workspace_id

  const { data: membersData } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => WorkspacesService.readWorkspaceMembers({ id: workspaceId! }),
    enabled: !!workspaceId
  })

  const memberCollection = useMemo(() => createListCollection({
      items: membersData?.data.map(u => ({ label: u.full_name || u.email, value: u.id })) || []
  }), [membersData])
  
  const projectCollection = useMemo(() => createListCollection({
      items: projects.map(p => ({ label: p.name, value: p.id }))
  }), [projects])
  
  const statusCollection = useMemo(() => createListCollection({
      items: [
          { label: "To Do", value: "todo" },
          { label: "In Progress", value: "in_progress" },
          { label: "Done", value: "done" },
      ]
  }), [])
  
  const priorityCollection = useMemo(() => createListCollection({
      items: [
          { label: "Low", value: "low" },
          { label: "Medium", value: "medium" },
          { label: "High", value: "high" },
      ]
  }), [])

  const mutation = useMutation({
    mutationFn: (data: any) =>
      TasksService.createTask({ requestBody: data }),
    onSuccess: () => {
      showSuccessToast("Task created successfully.")
      reset()
      setIsOpen(false)
      onSuccess?.()
    },
    onError: (err: ApiError) => {
      handleError(err)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] })
    },
  })

  const onSubmit: SubmitHandler<any> = (data) => {
    mutation.mutate({
        ...data,
        section_id: data.section_id || null,
        assignee_id: data.assignee_id || null, 
    })
  }

  return (
    <DialogRoot
      size={{ base: "xs", md: "md" }}
      placement="center"
      open={isOpen}
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <DialogTrigger asChild>
        <Button value="add-task" my={4}>
          <FaPlus fontSize="16px" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <Text mb={4}>Create a new task.</Text>
            <VStack gap={4}>
              <Field
                required
                invalid={!!errors.title}
                errorText={errors.title?.message?.toString()}
                label="Title"
              >
                <Input
                  {...register("title", {
                    required: "Title is required.",
                  })}
                  placeholder="Task Title"
                  type="text"
                />
              </Field>

              <Field
                invalid={!!errors.description}
                errorText={errors.description?.message?.toString()}
                label="Description"
              >
                <Input
                  {...register("description")}
                  placeholder="Description"
                  type="text"
                />
              </Field>

              <Controller
                control={control}
                name="project_id"
                rules={{ required: "Project is required" }}
                render={({ field }) => (
                  <Field
                    label="Project"
                    invalid={!!errors.project_id}
                    errorText={errors.project_id?.message?.toString()}
                    required
                  >
                    <SelectRoot
                        name={field.name}
                        value={[field.value]}
                        onValueChange={({ value }: { value: string[] }) => field.onChange(value[0])}
                        onInteractOutside={() => field.onBlur()}
                        collection={projectCollection}
                    >
                      <SelectLabel />
                      <SelectTrigger>
                        <SelectValueText placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectCollection.items.map((project) => (
                          <SelectItem item={project} key={project.value}>
                            {project.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="assignee_id"
                render={({ field }) => (
                  <Field
                    label="Assignee"
                    invalid={!!errors.assignee_id}
                    errorText={errors.assignee_id?.message?.toString()}
                  >
                    <SelectRoot
                        name={field.name}
                        value={[field.value || ""]}
                        onValueChange={({ value }: { value: string[] }) => field.onChange(value[0])}
                        onInteractOutside={() => field.onBlur()}
                        collection={memberCollection}
                        disabled={!workspaceId}
                    >
                      <SelectLabel />
                      <SelectTrigger>
                        <SelectValueText placeholder="Select assignee" />
                      </SelectTrigger>
                      <SelectContent>
                        {memberCollection.items.map((member) => (
                          <SelectItem item={member} key={member.value}>
                            {member.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                )}
              />
              
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Field
                    label="Status"
                    invalid={!!errors.status}
                    errorText={errors.status?.message?.toString()}
                  >
                    <SelectRoot
                        name={field.name}
                        value={[field.value || "todo"]}
                        onValueChange={({ value }: { value: string[] }) => field.onChange(value[0])}
                        onInteractOutside={() => field.onBlur()}
                        collection={statusCollection}
                    >
                      <SelectLabel />
                      <SelectTrigger>
                        <SelectValueText placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusCollection.items.map((stat) => (
                          <SelectItem item={stat} key={stat.value}>
                            {stat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                )}
              />
              
               <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Field
                    label="Priority"
                    invalid={!!errors.priority}
                    errorText={errors.priority?.message?.toString()}
                  >
                    <SelectRoot
                        name={field.name}
                        value={[field.value || "medium"]}
                        onValueChange={({ value }: { value: string[] }) => field.onChange(value[0])}
                        onInteractOutside={() => field.onBlur()}
                        collection={priorityCollection}
                    >
                      <SelectLabel />
                      <SelectTrigger>
                        <SelectValueText placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityCollection.items.map((prio) => (
                          <SelectItem item={prio} key={prio.value}>
                            {prio.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>
                )}
              />

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
              loading={mutation.isPending || isSubmitting}
            >
              Save
            </Button>
          </DialogFooter>
        </form>
        <DialogCloseTrigger />
      </DialogContent>
    </DialogRoot>
  )
}

export default AddTask
