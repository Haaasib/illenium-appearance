Radial = {}

Radial.MenuID = "open_clothing_menu"

local radialOptionAdded = false

function Radial.IsOX()
    local resName = "ox_lib"
    if GetResourceState(resName) ~= "missing" and Config.UseOxRadial then
        Radial.ResourceName = resName
        return true
    end
    return false
end

function Radial.IsQB()
    local resName = "qb-radialmenu"
    if GetResourceState(resName) ~= "missing" then
        Radial.ResourceName = resName
        return true
    end
    return false
end

function Radial.IsQBX()
    local resName = "qbx_radialmenu"
    if GetResourceState(resName) ~= "missing" then
        Radial.ResourceName = resName
        return true
    end
    return false
end

function Radial.AddOption(currentZone)
    return
end

function Radial.RemoveOption()
    return
end

AddEventHandler("onResourceStop", function(resource)
    if resource == GetCurrentResourceName() then
        if Config.UseOxRadial and GetResourceState("ox_lib") == "started" or GetResourceState("qb-radialmenu") == "started" then
            Radial.RemoveOption()
        end
    end
end)
