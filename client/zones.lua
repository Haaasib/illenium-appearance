if Config.UseTarget then return end

local currentZone = nil

local Zones = {
    Store = {},
    ClothingRoom = {},
    PlayerOutfitRoom = {}
}

local function RemoveZones()
    for i = 1, #Zones.Store do
        if Zones.Store[i]["remove"] then
            Zones.Store[i]:remove()
        end
    end
    for i = 1, #Zones.ClothingRoom do
        Zones.ClothingRoom[i]:remove()
    end
    for i = 1, #Zones.PlayerOutfitRoom do
        Zones.PlayerOutfitRoom[i]:remove()
    end
end

local function lookupZoneIndexFromID(zones, id)
    for i = 1, #zones do
        if zones[i] and zones[i].id == id then
            return zones[i].storeIndex or i
        end
    end
    return nil
end

local function onStoreEnter(data)
    local index = lookupZoneIndexFromID(Zones.Store, data.id)
    local store = index and Config.Stores[index]
    if not store then return end

    local jobName = (store.job and client.job and client.job.name) or (store.gang and client.gang and client.gang.name)
    if not store.job and not store.gang or (jobName and jobName == (store.job or store.gang)) then
        currentZone = {
            name = store.type,
            index = index
        }
        local prefix = "[E] "
        if currentZone.name == "clothing" then
            lib.showTextUI(prefix .. "Open Clothing Store", Config.TextUIOptions)
        elseif currentZone.name == "barber" then
            lib.showTextUI(prefix .. "Open Barber Shop", Config.TextUIOptions)
        elseif currentZone.name == "tattoo" then
            lib.showTextUI(prefix .. "Open Tattoo Shop", Config.TextUIOptions)
        elseif currentZone.name == "surgeon" then
            lib.showTextUI(prefix .. "Open Plastic Surgeon", Config.TextUIOptions)
        end
        Radial.AddOption(currentZone)
    end
end

local function onClothingRoomEnter(data)
    local index = lookupZoneIndexFromID(Zones.ClothingRoom, data.id)
    local clothingRoom = Config.ClothingRooms[index]

    local jobName = clothingRoom.job and client.job.name or client.gang.name
    if jobName == (clothingRoom.job or clothingRoom.gang) then
        if CheckDuty() or clothingRoom.gang then
            currentZone = {
                name = "clothingRoom",
                index = index
            }
            local prefix = Config.UseRadialMenu and "" or "[E] "
            lib.showTextUI(prefix .. _L("textUI.clothingRoom"), Config.TextUIOptions)
            Radial.AddOption(currentZone)
        end
    end
end

local function onPlayerOutfitRoomEnter(data)
    local index = lookupZoneIndexFromID(Zones.PlayerOutfitRoom, data.id)
    local playerOutfitRoom = Config.PlayerOutfitRooms[index]

    local isAllowed = IsPlayerAllowedForOutfitRoom(playerOutfitRoom)
    if isAllowed then
        currentZone = {
            name = "playerOutfitRoom",
            index = index
        }
        local prefix = Config.UseRadialMenu and "" or "[E] "
        lib.showTextUI(prefix .. _L("textUI.playerOutfitRoom"), Config.TextUIOptions)
        Radial.AddOption(currentZone)
    end
end

local function onZoneExit()
    currentZone = nil
    Radial.RemoveOption()
    lib.hideTextUI()
end

local function SetupZone(store, onEnter, onExit)
    if Config.RCoreTattoosCompatibility and store.type == "tattoo" then
        return {}
    end

    if Config.UseRadialMenu or store.usePoly then
        return lib.zones.poly({
            points = store.points,
            debug = Config.Debug,
            onEnter = onEnter,
            onExit = onExit
        })
    end

    return lib.zones.box({
        coords = store.coords,
        size = store.size,
        rotation = store.rotation,
        debug = Config.Debug,
        onEnter = onEnter,
        onExit = onExit
    })
end

local function SetupStoreZones()
    for _, v in pairs(Config.Stores) do
        Zones.Store[#Zones.Store + 1] = SetupZone(v, onStoreEnter, onZoneExit)
    end
end

local function SetupClothingRoomZones()
    for _, v in pairs(Config.ClothingRooms) do
        Zones.ClothingRoom[#Zones.ClothingRoom + 1] = SetupZone(v, onClothingRoomEnter, onZoneExit)
    end
end

local function SetupPlayerOutfitRoomZones()
    for _, v in pairs(Config.PlayerOutfitRooms) do
        Zones.PlayerOutfitRoom[#Zones.PlayerOutfitRoom + 1] = SetupZone(v, onPlayerOutfitRoomEnter, onZoneExit)
    end
end

local function SetupZones()
    SetupStoreZones()
    SetupClothingRoomZones()
    SetupPlayerOutfitRoomZones()
end

local function ZonesLoop()
    Wait(1000)
    while true do
        local sleep = 1000
        if currentZone then
            sleep = 5
            if IsControlJustReleased(0, 38) then
                if currentZone.name == "clothingRoom" then
                    local clothingRoom = Config.ClothingRooms[currentZone.index]
                    local outfits = GetPlayerJobOutfits(clothingRoom.job)
                    TriggerEvent("illenium-appearance:client:openJobOutfitsMenu", outfits)
                elseif currentZone.name == "playerOutfitRoom" then
                    local outfitRoom = Config.PlayerOutfitRooms[currentZone.index]
                    OpenOutfitRoom(outfitRoom)
                elseif currentZone.name == "clothing" then
                    TriggerEvent("illenium-appearance:client:openClothingShopMenu")
                elseif currentZone.name == "barber" then
                    OpenBarberShop()
                elseif currentZone.name == "tattoo" then
                    OpenTattooShop()
                elseif currentZone.name == "surgeon" then
                    OpenSurgeonShop()
                end
            end
        end
        Wait(sleep)
    end
end


CreateThread(function()
    SetupZones()
    if not Config.UseRadialMenu then
        ZonesLoop()
    end
end)

AddEventHandler("onResourceStop", function(resource)
    if resource == GetCurrentResourceName() then
        RemoveZones()
    end
end)

RegisterNetEvent("illenium-appearance:client:OpenClothingRoom", function()
    local clothingRoom = Config.ClothingRooms[currentZone.index]
    local outfits = GetPlayerJobOutfits(clothingRoom.job)
    TriggerEvent("illenium-appearance:client:openJobOutfitsMenu", outfits)
end)

RegisterNetEvent("illenium-appearance:client:OpenPlayerOutfitRoom", function()
    local outfitRoom = Config.PlayerOutfitRooms[currentZone.index]
    OpenOutfitRoom(outfitRoom)
end)
