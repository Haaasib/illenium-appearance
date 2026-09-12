local DEFAULT_FM_PATH = 'illenium-appearance/clothing'

local function getComponentConfig()
    return {
        masks = not Config.DisableComponents.Masks,
        upperBody = not Config.DisableComponents.UpperBody,
        lowerBody = not Config.DisableComponents.LowerBody,
        bags = not Config.DisableComponents.Bags,
        shoes = not Config.DisableComponents.Shoes,
        scarfAndChains = not Config.DisableComponents.ScarfAndChains,
        bodyArmor = not Config.DisableComponents.BodyArmor,
        shirts = not Config.DisableComponents.Shirts,
        decals = not Config.DisableComponents.Decals,
        jackets = not Config.DisableComponents.Jackets
    }
end

local function getPropConfig()
    return {
        hats = not Config.DisableProps.Hats,
        glasses = not Config.DisableProps.Glasses,
        ear = not Config.DisableProps.Ear,
        watches = not Config.DisableProps.Watches,
        bracelets = not Config.DisableProps.Bracelets
    }
end

function GetDefaultConfig()
    local images = Config.ClothingImages or {}
    local fm = images.Fivemanage or {}
    local baseUrl = ''
    if type(fm.BaseUrl) == 'string' then
        baseUrl = fm.BaseUrl:gsub('/+$', '')
    end
    return {
        ped = false,
        headBlend = false,
        faceFeatures = false,
        headOverlays = false,
        components = false,
        componentConfig = getComponentConfig(),
        props = false,
        propConfig = getPropConfig(),
        tattoos = false,
        enableExit = true,
        hasTracker = Config.PreventTrackerRemoval and Framework.HasTracker(),
        automaticFade = Config.AutomaticFade,
        isFree = false,
        prices = Config.ClothingPrices,
        images = {
            UseCdn = images.UseCdn == true,
            BaseUrl = baseUrl,
            Path = (type(fm.Path) == 'string' and fm.Path ~= '' and fm.Path) or DEFAULT_FM_PATH,
            Components = images.Components,
            Props = images.Props,
            Hair = images.Hair,
        }
    }
end
