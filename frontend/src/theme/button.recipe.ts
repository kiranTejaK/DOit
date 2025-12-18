import { defineRecipe } from "@chakra-ui/react"

export const buttonRecipe = defineRecipe({
  base: {
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    colorPalette: "ui",
  },
  variants: {
    variant: {
      solid: {
        bg: "ui.main",
        color: "white",
        _hover: {
          opacity: 0.9,
        },
      },
      ghost: {
        bg: "transparent",
        _hover: {
          bg: "gray.100",
        },
      },
    },
  },
})
