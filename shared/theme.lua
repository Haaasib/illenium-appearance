Config = Config or {}

-- ====================================================================
--                      ILLENIUM APPEARANCE THEME CONFIG
-- ====================================================================
-- Select active theme preset:
-- "default"       -> Clean White & Dark (Original High Contrast)
-- "cyan-neon"     -> Cyberpunk Cyan Neon & Dark Blue
-- "red-dark"      -> Crimson Red & Charcoal
-- "gold-luxury"   -> Gold & Metallic Black
-- "emerald-green" -> Emerald Green & Deep Teal
-- "purple-night"  -> Royal Purple & Midnight Black
-- "custom"        -> Uses the custom table below
-- ====================================================================

Config.Theme = {
    currentTheme = "default",

    -- Custom theme settings (active when currentTheme = "custom")
    custom = {
        fontTitle = "Bebas Neue",                -- Title Font ("Bebas Neue", "Oswald", "Inter", "Poppins", "Roboto")
        fontBody = "Oswald",                     -- Body Font ("Oswald", "Inter", "Roboto", "Montserrat", "Poppins")
        headerBg = "#ffffff",                    -- Header Bar Background Color
        headerText = "#000000",                  -- Header Bar Text Color
        accentColor = "#00c8ff",                 -- Primary Accent / Active Ring / Selected Track Color
        accentText = "#000000",                  -- Text Color on Accent Elements
        cardBg = "#16181f",                      -- Card & Slider Background
        cardBorder = "rgba(255, 255, 255, 0.08)",-- Card Border Color
        mainTextColor = "#ffffff",               -- Main Text Color
        subTextColor = "#a1a1aa",                -- Secondary / Muted Text Color
    },

    -- Theme Presets List
    themes = {
        {
            id = "default",
            name = "Default Clean White",
            fontTitle = "Bebas Neue",
            fontBody = "Oswald",
            headerBg = "#ffffff",
            headerText = "#000000",
            accentColor = "#ffffff",
            accentText = "#000000",
            cardBg = "#16181f",
            cardBorder = "rgba(255, 255, 255, 0.08)",
            mainTextColor = "#ffffff",
            subTextColor = "#a1a1aa"
        },
        {
            id = "cyan-neon",
            name = "Cyan Cyberpunk",
            fontTitle = "Bebas Neue",
            fontBody = "Oswald",
            headerBg = "#00c8ff",
            headerText = "#000000",
            accentColor = "#00c8ff",
            accentText = "#000000",
            cardBg = "#0e131b",
            cardBorder = "rgba(0, 200, 255, 0.2)",
            mainTextColor = "#ffffff",
            subTextColor = "#7dd3fc"
        },
        {
            id = "red-dark",
            name = "Crimson QBCore",
            fontTitle = "Bebas Neue",
            fontBody = "Oswald",
            headerBg = "#dc2626",
            headerText = "#ffffff",
            accentColor = "#dc2626",
            accentText = "#ffffff",
            cardBg = "#181214",
            cardBorder = "rgba(220, 38, 38, 0.2)",
            mainTextColor = "#ffffff",
            subTextColor = "#fca5a5"
        },
        {
            id = "gold-luxury",
            name = "Gold Luxury",
            fontTitle = "Bebas Neue",
            fontBody = "Oswald",
            headerBg = "#eab308",
            headerText = "#000000",
            accentColor = "#eab308",
            accentText = "#000000",
            cardBg = "#17150e",
            cardBorder = "rgba(234, 179, 8, 0.2)",
            mainTextColor = "#ffffff",
            subTextColor = "#fde047"
        },
        {
            id = "emerald-green",
            name = "Emerald Green",
            fontTitle = "Bebas Neue",
            fontBody = "Oswald",
            headerBg = "#10b981",
            headerText = "#000000",
            accentColor = "#10b981",
            accentText = "#000000",
            cardBg = "#0c1814",
            cardBorder = "rgba(16, 185, 129, 0.2)",
            mainTextColor = "#ffffff",
            subTextColor = "#6ee7b7"
        },
        {
            id = "purple-night",
            name = "Purple Night",
            fontTitle = "Bebas Neue",
            fontBody = "Oswald",
            headerBg = "#a855f7",
            headerText = "#ffffff",
            accentColor = "#a855f7",
            accentText = "#ffffff",
            cardBg = "#150e1b",
            cardBorder = "rgba(168, 85, 247, 0.2)",
            mainTextColor = "#ffffff",
            subTextColor = "#d8b4fe"
        }
    }
}
