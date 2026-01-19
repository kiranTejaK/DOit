import { createSystem, defaultConfig } from "@chakra-ui/react"
import { buttonRecipe } from "./theme/button.recipe"

export const system = createSystem(defaultConfig, {
  globalCss: {
    html: {
      fontSize: "16px",
    },
    body: {
      fontSize: "0.875rem",
      margin: 0,
      padding: 0,
    },
    ".main-link": {
      color: "ui.main",
      fontWeight: "bold",
    },
  },
  theme: {
    semanticTokens: {
      colors: {
        ui: {
          main: { value: { base: "#fb923c", _dark: "#fb923c" } },
        },
        bg: {
          main: { value: { base: "#F8F9FA", _dark: "#111111" } },
          sub: { value: { base: "#FFFFFF", _dark: "#1A1A1A" } },
          muted: { value: { base: "#F3F4F6", _dark: "#262626" } },
        },
        border: {
          main: { value: { base: "#E5E7EB", _dark: "#333333" } },
        },
      },
    },
    recipes: {
      button: buttonRecipe,
    },
  },
})
