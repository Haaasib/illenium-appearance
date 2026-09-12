local isCapturing       = false
local isBrowsing        = false
local isPaused          = false
local isCancelled       = false
local isPreview         = false
local captureCamera     = nil
local captureGender     = 'male'
local captureRotOffset  = 0.0
local savedCameraAngles = {}
local activePreviewCamera = nil
local orbitCam      = nil
local orbitAngleH   = 0.0
local orbitDist     = 1.2
local orbitCenter   = vector3(0.0, 0.0, 0.0)
local orbitFov      = 40.0
local imageRelPath = function(kind, gender, id, drawable, texture)
    local folder
    if kind == 'prop' then
        folder = Customize.PropFolders[id] or ('prop_' .. id)
    elseif kind == 'overlay' then
        folder = Customize.OverlayFolders[id] or ('overlay_' .. id)
    else
        folder = Customize.ComponentFolders[id] or tostring(id)
    end
    if texture and texture > 0 then
        return ('%s/%s/%d_%d'):format(gender, folder, drawable, texture)
    end
    return ('%s/%s/%d'):format(gender, folder, drawable)
end
local nuiImagesBase = function()
    return ('https://cfx-nui-%s/%s'):format(GetCurrentResourceName(), Customize.ImageFolder or 'images')
end
local orbitBaseDist = 1.2
local orbitRoll     = 0.0
local orbitCamZ     = 0.0   -- camera Z offset (center stays fixed, camera moves up/down)

local pedAppearance = {
    model = nil, coords = nil, heading = nil,
    components = {}, props = {},
    headBlend = nil, faceFeatures = {}, headOverlays = {},
}


local function HideHUD(state)
    DisplayRadar(not state)
    DisplayHud(not state)
end

local function SuppressWorld()
    SetVehicleDensityMultiplierThisFrame(0.0)
    SetPedDensityMultiplierThisFrame(0.0)
    SetRandomVehicleDensityMultiplierThisFrame(0.0)
    SetParkedVehicleDensityMultiplierThisFrame(0.0)
    SetScenarioPedDensityMultiplierThisFrame(0.0, 0.0)
    SetGarbageTrucks(false)
    SetRandomBoats(false)
    SetRandomTrains(false)
end

local function GetPedGender(ped)
    return (GetEntityModel(ped) == GetHashKey('mp_m_freemode_01')) and 'male' or 'female'
end

local function LoadModel(modelHash)
    RequestModel(modelHash)
    local timeout = GetGameTimer() + 5000
    while not HasModelLoaded(modelHash) and GetGameTimer() < timeout do
        Wait(10)
    end
    return HasModelLoaded(modelHash)
end


local function CreateCaptureCamera(entity, preset, presetName)
    local pedPos = GetEntityCoords(entity)
    local saved  = presetName and savedCameraAngles[presetName]
    local camX, camY, camZ, fov, lookZ, roll

    if saved then
        local zP = saved.zPos or preset.zPos
        local cZ = saved.camZ or 0.0
        camX  = pedPos.x + saved.dist * math.sin(saved.angleH)
        camY  = pedPos.y - saved.dist * math.cos(saved.angleH)
        camZ  = pedPos.z + zP + cZ
        fov   = saved.fov or preset.fov
        lookZ = pedPos.z + zP
        roll  = saved.roll or 0.0
    elseif preset.defaultAngleH then
        local dist = (orbitDist > 0 and orbitDist) or preset.dist or 1.2
        local aH   = orbitAngleH
        local cZ   = orbitCamZ or preset.defaultCamZ or 0.0
        camX  = pedPos.x + dist * math.sin(aH)
        camY  = pedPos.y - dist * math.cos(aH)
        camZ  = pedPos.z + preset.zPos + cZ
        fov   = (orbitFov and orbitFov > 0) and orbitFov or preset.fov
        lookZ = pedPos.z + preset.zPos
        roll  = orbitRoll or preset.defaultRoll or 0.0
    else
        local rotZ = preset.rotation.z + captureRotOffset
        SetEntityRotation(ped, preset.rotation.x, preset.rotation.y, rotZ, 2, false)
        Wait(50)
        local fwd = GetEntityForwardVector(ped)
        local dist = preset.dist or 1.2
        camX  = pedPos.x - fwd.x * dist
        camY  = pedPos.y - fwd.y * dist
        camZ  = pedPos.z - fwd.z + preset.zPos
        fov   = preset.fov
        lookZ = pedPos.z + preset.zPos
        roll  = 0.0
    end

    local cam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA', camX, camY, camZ, 0.0, 0.0, 0.0, fov, false, 0)
    SetCamNearClip(cam, 0.05)

    local dx = pedPos.x - camX
    local dy = pedPos.y - camY
    local dz = lookZ - camZ
    local dist2d = math.sqrt(dx * dx + dy * dy)
    local pitch  = math.deg(math.atan(dz, dist2d))
    local heading = -math.deg(math.atan(dx, dy))
    SetCamRot(cam, pitch, roll, heading, 2)

    SetCamActive(cam, true)
    RenderScriptCams(true, false, 0, true, true)
    return cam
end

local function DestroyCamera()
    if captureCamera then
        RenderScriptCams(false, false, 0, true, true)
        DestroyCam(captureCamera, false)
        captureCamera = nil
    end
end


local function DrawQuad(x1,y1,z1, x2,y2,z2, x3,y3,z3, x4,y4,z4, r,g,b,a)
    DrawPoly(x1,y1,z1, x2,y2,z2, x3,y3,z3, r,g,b,a)
    DrawPoly(x3,y3,z3, x4,y4,z4, x1,y1,z1, r,g,b,a)
    DrawPoly(x3,y3,z3, x2,y2,z2, x1,y1,z1, r,g,b,a)
    DrawPoly(x1,y1,z1, x4,y4,z4, x3,y3,z3, r,g,b,a)
end

local function DrawGreenScreenAndLights(entity)
    local pos = GetEntityCoords(entity)
    local gs = Customize.GreenScreen
    local lights = Customize.StudioLights
    local r, g, b = Customize.GreenScreen.color.r, Customize.GreenScreen.color.g, Customize.GreenScreen.color.b

    local hw = gs.width  * 0.5
    local hd = gs.depth  * 0.5
    local fz = pos.z + (gs.floorOffset or -3.0)
    local cz = fz + gs.height

    local x1, y1 = pos.x - hw, pos.y - hd
    local x2, y2 = pos.x + hw, pos.y - hd
    local x3, y3 = pos.x - hw, pos.y + hd
    local x4, y4 = pos.x + hw, pos.y + hd

    DrawQuad(x1,y1,fz, x2,y2,fz, x2,y2,cz, x1,y1,cz, r,g,b,255)
    DrawQuad(x4,y4,fz, x3,y3,fz, x3,y3,cz, x4,y4,cz, r,g,b,255)
    DrawQuad(x3,y3,fz, x1,y1,fz, x1,y1,cz, x3,y3,cz, r,g,b,255)
    DrawQuad(x2,y2,fz, x4,y4,fz, x4,y4,cz, x2,y2,cz, r,g,b,255)
    DrawQuad(x1,y1,fz, x2,y2,fz, x4,y4,fz, x3,y3,fz, r,g,b,255)
    DrawQuad(x3,y3,cz, x4,y4,cz, x2,y2,cz, x1,y1,cz, r,g,b,255)

    for _, light in ipairs(lights) do
        DrawLightWithRange(
            pos.x + light.offset.x,
            pos.y + light.offset.y,
            pos.z + light.offset.z,
            255, 255, 255,
            light.range,
            light.intensity
        )
    end
end


local cropBars = nil

local function ComputeCropBars()
    local tw = Customize.ScreenshotWidth or 0
    local th = Customize.ScreenshotHeight or 0
    if tw <= 0 or th <= 0 then cropBars = false return end

    local sw, sh = GetActiveScreenResolution()
    local screenAspect = sw / sh
    local targetAspect = tw / th

    if screenAspect > targetAspect then
        local barW = (1.0 - targetAspect / screenAspect) / 2.0
        cropBars = { mode = 'v', x1 = barW / 2.0, x2 = 1.0 - barW / 2.0, size = barW }
    elseif screenAspect < targetAspect then
        local barH = (1.0 - screenAspect / targetAspect) / 2.0
        cropBars = { mode = 'h', y1 = barH / 2.0, y2 = 1.0 - barH / 2.0, size = barH }
    else
        cropBars = false
    end
end

local function DrawCropOverlay()
    if cropBars == nil then ComputeCropBars() end
    if not cropBars then return end

    if cropBars.mode == 'v' then
        DrawRect(cropBars.x1, 0.5, cropBars.size, 1.0, 0, 0, 0, 150)
        DrawRect(cropBars.x2, 0.5, cropBars.size, 1.0, 0, 0, 0, 150)
    else
        DrawRect(0.5, cropBars.y1, 1.0, cropBars.size, 0, 0, 0, 150)
        DrawRect(0.5, cropBars.y2, 1.0, cropBars.size, 0, 0, 0, 150)
    end
end


local function UpdateOrbitCamera()
    if not orbitCam then return end
    local camX = orbitCenter.x + orbitDist * math.sin(orbitAngleH)
    local camY = orbitCenter.y - orbitDist * math.cos(orbitAngleH)
    local camZ = orbitCenter.z + orbitCamZ
    SetCamCoord(orbitCam, camX, camY, camZ)

    local dx = orbitCenter.x - camX
    local dy = orbitCenter.y - camY
    local dz = orbitCenter.z - camZ
    local dist2d = math.sqrt(dx * dx + dy * dy)
    local pitch  = math.deg(math.atan(dz, dist2d))
    local heading = -math.deg(math.atan(dx, dy))

    SetCamRot(orbitCam, pitch, orbitRoll, heading, 2)
end

local function SetOrbitPreset(presetName)
    if not orbitCam then return end
    local preset = Customize.CameraPresets[presetName]
    if not preset then return end

    local pedPos = GetEntityCoords(PlayerPedId())
    orbitCenter   = vector3(pedPos.x, pedPos.y, pedPos.z + preset.zPos)
    orbitBaseDist = preset.dist or 1.2
    orbitDist     = orbitBaseDist
    orbitFov      = preset.fov
    orbitCamZ     = preset.defaultCamZ or 0.0
    orbitRoll     = preset.defaultRoll or 0.0
    if preset.defaultAngleH then
        orbitAngleH = math.rad(preset.defaultAngleH)
    end
    SetCamFov(orbitCam, orbitFov)
    UpdateOrbitCamera()
end

local function CreateOrbitCamera(ped, presetName)
    local pName = presetName or (Customize.Categories[1] and Customize.Categories[1].camera) or 'torso'
    local preset = Customize.CameraPresets[pName]
    local pedPos = GetEntityCoords(ped)

    orbitCenter   = vector3(pedPos.x, pedPos.y, pedPos.z + preset.zPos)
    orbitBaseDist = preset.dist or 1.2
    orbitDist     = orbitBaseDist
    orbitFov      = preset.fov
    if preset.defaultAngleH then
        orbitAngleH = math.rad(preset.defaultAngleH)
    else
        orbitAngleH = math.rad((GetEntityHeading(ped) + 180.0) % 360.0)
    end
    orbitCamZ     = preset.defaultCamZ or 0.0
    orbitRoll     = preset.defaultRoll or 0.0

    local camX = orbitCenter.x + orbitDist * math.sin(orbitAngleH)
    local camY = orbitCenter.y - orbitDist * math.cos(orbitAngleH)

    orbitCam = CreateCamWithParams('DEFAULT_SCRIPTED_CAMERA',
        camX, camY, orbitCenter.z, 0.0, 0.0, 0.0, orbitFov, false, 0)
    SetCamNearClip(orbitCam, 0.05)
    SetCamActive(orbitCam, true)
    RenderScriptCams(true, false, 0, true, true)
    UpdateOrbitCamera()
end

local function DestroyOrbitCamera()
    if orbitCam then
        RenderScriptCams(false, false, 0, true, true)
        DestroyCam(orbitCam, false)
        orbitCam = nil
    end
end


local function ForceHighQuality()
    OverrideLodscaleThisFrame(1.0)
    SetHdArea(0.0, 0.0, -150.0, 50.0)
    SetFocusPosAndVel(0.0, 0.0, -150.0, 0.0, 0.0, 0.0)
end

local function WaitForClothingLoaded(ped, componentId, drawableId, textureId)
    SetPedPreloadVariationData(ped, componentId, drawableId, textureId)
    local timeout = GetGameTimer() + 800
    while not HasPedPreloadVariationDataFinished(ped) and GetGameTimer() < timeout do
        Wait(0)
    end
    SetPedComponentVariation(ped, componentId, drawableId, textureId, 0)
    ReleasePedPreloadVariationData(ped)
    ForceHighQuality()
    SetEntityLodDist(ped, 10000)
    Wait(0)
    ForceHighQuality()
    Wait(0)
end

local function WaitForPropLoaded(ped, propId, drawableId, textureId)
    SetPedPropIndex(ped, propId, drawableId, textureId, true)
    Wait(0)
    local timeout = GetGameTimer() + 2000
    while GetPedPropIndex(ped, propId) ~= drawableId and GetGameTimer() < timeout do
        Wait(10)
    end

    local coords = GetEntityCoords(ped)
    RequestCollisionAtCoord(coords.x, coords.y, coords.z)
    local streamTimeout = GetGameTimer() + 1500
    while not HasCollisionLoadedAroundEntity(ped) and GetGameTimer() < streamTimeout do
        Wait(10)
    end
    Wait(Customize.TextureLoadWait)
end


local function WaitForResume()
    if not isPaused then return end
    SendNUIMessage({ type = 'setCapturePaused', paused = true })
    SetNuiFocus(true, true)
    while isPaused and not isCancelled do Wait(100) end
    if not isCancelled then
        SendNUIMessage({ type = 'setCapturePaused', paused = false })
        SetNuiFocus(false, false)
        Wait(50)
    end
end


local captureWait = {}
local captureSeq = 0

RegisterNetEvent('illenium-appearance:client:captureResult', function(token, success, message)
    local wait = captureWait[token]
    if not wait then return end
    wait.done = true
    wait.ok = success and true or false
    wait.message = message
end)

local function CaptureAndUpload(filename)
    ForceHighQuality()
    if GetResourceState('screenshot-basic') ~= 'started' then
        print('^1[capturecloth]^0 screenshot-basic is not started')
        return
    end
    local encoding = Customize.ScreenshotFormat or 'png'
    if Customize.TransparentBg then encoding = 'png' end
    local opts = { encoding = encoding }
    if encoding ~= 'png' then
        opts.quality = Customize.ScreenshotQuality
    end
    local shotDone, base64 = false, nil
    exports['screenshot-basic']:requestScreenshot(opts, function(data)
        base64 = data
        shotDone = true
    end)
    local shotTimeout = GetGameTimer() + 8000
    while not shotDone and GetGameTimer() < shotTimeout do Wait(20) end
    if not base64 or base64 == '' then
        print('^1[capturecloth]^0 Screenshot empty (' .. filename .. ')')
        return
    end
    captureSeq = captureSeq + 1
    local token = captureSeq
    local wait = { done = false, ok = false, message = '' }
    captureWait[token] = wait
    TriggerLatentServerEvent('illenium-appearance:server:processCapture', Customize.LatentRate or 10000000, {
        token       = token,
        filename    = filename,
        format      = Customize.ScreenshotFormat or 'webp',
        transparent = Customize.TransparentBg and true or false,
        chromaKey   = Customize.ChromaKeyColor or 'green',
        width       = Customize.ScreenshotWidth or 0,
        height      = Customize.ScreenshotHeight or 0,
        quality     = Customize.ScreenshotQuality or 0.82,
        imageData   = base64,
    })
    local timeout = GetGameTimer() + 30000
    while not wait.done and GetGameTimer() < timeout do Wait(20) end
    captureWait[token] = nil
    if not wait.done then
        print('^1[capturecloth]^0 Upload timeout (' .. filename .. ')')
        return
    end
    if not wait.ok then
        print('^1[capturecloth]^0 Upload failed (' .. filename .. '): ' .. tostring(wait.message or ''))
    end
end

local function SendProgress(current, total, category)
    SendNUIMessage({ type = 'captureProgress', current = current, total = total, category = category })
end

local batchCounter = 0
local function ThrottledWait()
    batchCounter = batchCounter + 1
    if batchCounter % Customize.GCInterval == 0 then collectgarbage('collect') end
    if batchCounter % Customize.BatchSize == 0 then Wait(Customize.BatchPauseWait) end
end


local function SaveFullAppearance(ped)
    pedAppearance.model   = GetEntityModel(ped)
    pedAppearance.coords  = GetEntityCoords(ped)
    pedAppearance.heading = GetEntityHeading(ped)

    pedAppearance.components = {}
    for i = 0, 11 do
        pedAppearance.components[i] = {
            drawable = GetPedDrawableVariation(ped, i),
            texture  = GetPedTextureVariation(ped, i),
            palette  = GetPedPaletteVariation(ped, i),
        }
    end

    pedAppearance.props = {}
    for i = 0, 7 do
        pedAppearance.props[i] = {
            drawable = GetPedPropIndex(ped, i),
            texture  = GetPedPropTextureIndex(ped, i),
        }
    end

    local ok, hbData = pcall(GetPedHeadBlendData, ped)
    if ok and hbData and type(hbData) == 'table' then
        pedAppearance.headBlend = {
            shapeFirst  = hbData.shapeFirst  or hbData[1] or 0,
            shapeSecond = hbData.shapeSecond or hbData[2] or 0,
            shapeThird  = hbData.shapeThird  or hbData[3] or 0,
            skinFirst   = hbData.skinFirst   or hbData[4] or 0,
            skinSecond  = hbData.skinSecond  or hbData[5] or 0,
            skinThird   = hbData.skinThird   or hbData[6] or 0,
            shapeMix    = (hbData.shapeMix   or hbData[7] or 0.0) + 0.0,
            skinMix     = (hbData.skinMix    or hbData[8] or 0.0) + 0.0,
            thirdMix    = (hbData.thirdMix   or hbData[9] or 0.0) + 0.0,
        }
    else
        pedAppearance.headBlend = nil
    end

    pedAppearance.faceFeatures = {}
    for i = 0, 19 do pedAppearance.faceFeatures[i] = GetPedFaceFeature(ped, i) end

    pedAppearance.headOverlays = {}
    for i = 0, 12 do pedAppearance.headOverlays[i] = GetPedHeadOverlayValue(ped, i) end
end

local function RestoreFullAppearance()
    local model = pedAppearance.model
    if not model then return end

    if LoadModel(model) then
        SetPlayerModel(PlayerId(), model)
        Wait(150)
        SetModelAsNoLongerNeeded(model)
        Wait(150)
    end

    local ped = PlayerPedId()

    if pedAppearance.coords then
        local x, y, z = pedAppearance.coords.x, pedAppearance.coords.y, pedAppearance.coords.z

        FreezeEntityPosition(ped, true)
        SetEntityCollision(ped, false, false)
        SetEntityCoordsNoOffset(ped, x, y, z, false, false, false)
        if pedAppearance.heading then
            SetEntityHeading(ped, pedAppearance.heading)
        end

        SetFocusPosAndVel(x, y, z, 0.0, 0.0, 0.0)
        RequestCollisionAtCoord(x, y, z)
        NewLoadSceneStart(x, y, z, 100.0, 0)

        local timeout = GetGameTimer() + 5000
        while not HasCollisionLoadedAroundEntity(ped) and GetGameTimer() < timeout do
            RequestCollisionAtCoord(x, y, z)
            Wait(0)
        end

        if IsNewLoadSceneActive() then NewLoadSceneStop() end
        ClearFocus()
    end

    if pedAppearance.headBlend then
        local hb = pedAppearance.headBlend
        SetPedHeadBlendData(ped, hb.shapeFirst, hb.shapeSecond, hb.shapeThird, hb.skinFirst, hb.skinSecond, hb.skinThird, hb.shapeMix, hb.skinMix, hb.thirdMix, false)
    end

    for i = 0, 19 do
        if pedAppearance.faceFeatures[i] then SetPedFaceFeature(ped, i, pedAppearance.faceFeatures[i]) end
    end
    for i = 0, 12 do
        local val = pedAppearance.headOverlays[i]
        if val and val >= 0 then SetPedHeadOverlay(ped, i, val, 1.0) end
    end
    for i = 0, 11 do
        local comp = pedAppearance.components[i]
        if comp then SetPedComponentVariation(ped, i, comp.drawable, comp.texture, comp.palette) end
    end
    for i = 0, 7 do
        local prop = pedAppearance.props[i]
        if prop then
            if prop.drawable == -1 then ClearPedProp(ped, i)
            else SetPedPropIndex(ped, i, prop.drawable, prop.texture, true) end
        end
    end

    SetEntityCollision(ped, true, true)
    FreezeEntityPosition(ped, false)
    ClearPedTasksImmediately(ped)
    Wait(100)
    ClearPedTasks(ped)
    SetPlayerControl(PlayerId(), true, 0)
end


local function SetupCapturePed(modelHash)
    if not LoadModel(modelHash) then return PlayerPedId() end

    SetPlayerModel(PlayerId(), modelHash)
    Wait(150)
    SetModelAsNoLongerNeeded(modelHash)
    Wait(150)

    local ped = PlayerPedId()
    SetPedHeadBlendData(ped, 21, 22, 0, 21, 22, 0, 0.5, 0.5, 0.0, false)
    local timeout = GetGameTimer() + 2000
    while not HasPedHeadBlendFinished(ped) and GetGameTimer() < timeout do
        Wait(0)
    end
    FinalizeHeadBlend(ped)
    SetEntityCoordsNoOffset(ped, Customize.StudioCoords.x, Customize.StudioCoords.y, Customize.StudioCoords.z, false, false, false)
    SetEntityHeading(ped, Customize.StudioHeading)
    FreezeEntityPosition(ped, true)
    Wait(50)
    SetPlayerControl(PlayerId(), false, 0)
    return ped
end

local function ResetPedForCategory(ped, visibleComponents, componentOverrides)
    SetPedDefaultComponentVariation(ped)
    Wait(150)

    for _, p in ipairs({0, 1, 2, 6, 7}) do ClearPedProp(ped, p) end

    SetPlayerControl(PlayerId(), false, 0)
    FreezeEntityPosition(ped, true)

    local visSet = {}
    if visibleComponents then
        for _, id in ipairs(visibleComponents) do visSet[id] = true end
    end

    local overrides = componentOverrides or {}

    for i = 0, 11 do
        if overrides[i] then
            SetPedComponentVariation(ped, i, overrides[i], 0, 0)
        elseif visSet[i] then
            SetPedComponentVariation(ped, i, 0, 0, 0)
        else
            SetPedComponentVariation(ped, i, -1, 0, 0)
        end
    end
end


local function LoadAnimDict(dict)
    RequestAnimDict(dict)
    local timeout = GetGameTimer() + 5000
    while not HasAnimDictLoaded(dict) and GetGameTimer() < timeout do Wait(10) end
    return HasAnimDictLoaded(dict)
end

local function PlayCategoryAnim(ped, animConfig)
    if not animConfig then return end
    if LoadAnimDict(animConfig.dict) then
        TaskPlayAnim(ped, animConfig.dict, animConfig.name, 8.0, -8.0, -1, animConfig.flag or 49, 0, false, false, false)
        Wait(500)
    end
end

local function StopCategoryAnim(ped)
    ClearPedTasks(ped)
    Wait(100)
end


local function SetupCategoryCamera(ped, cameraName)
    local preset   = Customize.CameraPresets[cameraName]
    local hasSaved = savedCameraAngles[cameraName] ~= nil
    DestroyCamera()
    captureCamera = CreateCaptureCamera(ped, preset, cameraName)
    return preset, hasSaved
end

local function ReapplyRotation(ped, preset, hasSaved)
    if hasSaved or preset.defaultAngleH then return end
    SetEntityRotation(ped, preset.rotation.x, preset.rotation.y, preset.rotation.z + captureRotOffset, 2, false)
end

local function CaptureComponents(ped, gender, selectedSet)
    local totalItems, captured = 0, 0

    for _, cat in ipairs(Customize.Categories) do
        if not selectedSet or selectedSet[cat.componentId] then
            local n = GetNumberOfPedDrawableVariations(ped, cat.componentId)
            if Customize.CaptureAllTextures then
                for d = 0, n - 1 do totalItems = totalItems + GetNumberOfPedTextureVariations(ped, cat.componentId, d) end
            else
                totalItems = totalItems + n
            end
        end
    end

    for _, cat in ipairs(Customize.Categories) do
        if isCancelled then return end
        if selectedSet and not selectedSet[cat.componentId] then goto nextComp end

        ResetPedForCategory(ped, cat.visibleComponents, cat.componentOverrides)
        hideHeadActive = cat.hideHead or false
        local preset, hasSaved = SetupCategoryCamera(ped, cat.camera)

        for drawableId = 0, GetNumberOfPedDrawableVariations(ped, cat.componentId) - 1 do
            if isCancelled then return end
            local maxTex = Customize.CaptureAllTextures and GetNumberOfPedTextureVariations(ped, cat.componentId, drawableId) - 1 or 0

            for textureId = 0, maxTex do
                if isCancelled then return end
                WaitForResume()
                if isCancelled then return end

                WaitForClothingLoaded(ped, cat.componentId, drawableId, textureId)
                ReapplyRotation(ped, preset, hasSaved)
                Wait(Customize.WaitAfterApply)

                CaptureAndUpload(imageRelPath('component', gender, cat.componentId, drawableId, textureId))

                captured = captured + 1
                SendProgress(captured, totalItems, cat.label)
                Wait(Customize.WaitAfterCapture)
                ThrottledWait()
            end
        end

        ::nextComp::
    end
end

local function CaptureProps(ped, gender, selectedSet)
    local totalItems, captured = 0, 0

    for _, cat in ipairs(Customize.PropCategories) do
        if not selectedSet or selectedSet[cat.propId] then
            local n = GetNumberOfPedPropDrawableVariations(ped, cat.propId)
            if Customize.CaptureAllTextures then
                for d = 0, n - 1 do totalItems = totalItems + GetNumberOfPedPropTextureVariations(ped, cat.propId, d) end
            else
                totalItems = totalItems + n
            end
        end
    end

    for _, cat in ipairs(Customize.PropCategories) do
        if isCancelled then return end
        if selectedSet and not selectedSet[cat.propId] then goto nextProp end

        ResetPedForCategory(ped, cat.visibleComponents, cat.componentOverrides)
        hideHeadActive = cat.hideHead or false
        local preset, hasSaved = SetupCategoryCamera(ped, cat.camera)
        PlayCategoryAnim(ped, cat.anim)

        for drawableId = 0, GetNumberOfPedPropDrawableVariations(ped, cat.propId) - 1 do
            if isCancelled then return end
            local maxTex = Customize.CaptureAllTextures and GetNumberOfPedPropTextureVariations(ped, cat.propId, drawableId) - 1 or 0

            for textureId = 0, maxTex do
                if isCancelled then return end
                WaitForResume()
                if isCancelled then return end

                WaitForPropLoaded(ped, cat.propId, drawableId, textureId)
                ReapplyRotation(ped, preset, hasSaved)
                Wait(Customize.WaitAfterApply)

                CaptureAndUpload(imageRelPath('prop', gender, cat.propId, drawableId, textureId))

                captured = captured + 1
                SendProgress(captured, totalItems, cat.label)
                Wait(Customize.WaitAfterCapture)
                ThrottledWait()
            end
        end

        StopCategoryAnim(ped)
        ClearPedProp(ped, cat.propId)
        ::nextProp::
    end
end

local function ApplyOverlayWithColor(ped, overlayIndex, variationId)
    SetPedHeadOverlay(ped, overlayIndex, variationId, 1.0)
    for _, cat in ipairs(Customize.OverlayCategories or {}) do
        if cat.overlayIndex == overlayIndex and cat.colorType then
            SetPedHeadOverlayColor(ped, overlayIndex, cat.colorType, cat.colorId or 1, cat.colorId or 1)
            break
        end
    end
end


local function CaptureOverlays(ped, gender, selectedSet)
    local cats = Customize.OverlayCategories or {}
    local totalItems, captured = 0, 0

    for _, cat in ipairs(cats) do
        if not selectedSet or selectedSet[cat.overlayIndex] then
            totalItems = totalItems + GetPedHeadOverlayNum(cat.overlayIndex)
        end
    end

    for _, cat in ipairs(cats) do
        if isCancelled then return end
        if selectedSet and not selectedSet[cat.overlayIndex] then goto nextOverlay end

        ResetPedForCategory(ped, cat.visibleComponents, cat.componentOverrides)
        hideHeadActive = false

        for i = 0, 12 do SetPedHeadOverlay(ped, i, 255, 1.0) end

        local preset, hasSaved = SetupCategoryCamera(ped, cat.camera)
        local numVariations = GetPedHeadOverlayNum(cat.overlayIndex)

        for variationId = 0, numVariations - 1 do
            if isCancelled then return end
            WaitForResume()
            if isCancelled then return end

            ApplyOverlayWithColor(ped, cat.overlayIndex, variationId)
            ReapplyRotation(ped, preset, hasSaved)
            Wait(Customize.WaitAfterApply)

            CaptureAndUpload(imageRelPath('overlay', gender, cat.overlayIndex, variationId, 0))

            captured = captured + 1
            SendProgress(captured, totalItems, cat.label)
            Wait(Customize.WaitAfterCapture)
            ThrottledWait()
        end

        ::nextOverlay::
    end
end


local function CleanupCapture()
    DestroyCamera()
    HideHUD(false)
    hideHeadActive = false
    isCapturing = false
    isPreview   = false
    isPaused    = false
    isCancelled = false
    local ped = PlayerPedId()
    if not IsEntityVisible(ped) then SetEntityVisible(ped, true, false) end
    RestoreFullAppearance()
    TriggerServerEvent('illenium-appearance:server:resetBucket')
    SetNuiFocus(false, false)
end


local function RecaptureSpecificItems(items)
    local cameraMap, visibilityMap, animMap, overridesMap, hideHeadMap = {}, {}, {}, {}, {}
    for _, cat in ipairs(Customize.Categories) do
        local key = 'component_' .. cat.componentId
        cameraMap[key]     = cat.camera
        visibilityMap[key] = cat.visibleComponents
        overridesMap[key]  = cat.componentOverrides
        hideHeadMap[key]   = cat.hideHead or false
    end
    for _, cat in ipairs(Customize.PropCategories) do
        local key = 'prop_' .. cat.propId
        cameraMap[key]     = cat.camera
        visibilityMap[key] = cat.visibleComponents
        overridesMap[key]  = cat.componentOverrides
        hideHeadMap[key]   = cat.hideHead or false
        animMap[key]       = cat.anim
    end
    for _, cat in ipairs(Customize.OverlayCategories or {}) do
        local key = 'overlay_' .. cat.overlayIndex
        cameraMap[key]     = cat.camera
        visibilityMap[key] = cat.visibleComponents
        hideHeadMap[key]   = false
    end

    local total = #items
    local model = pedAppearance.model or GetEntityModel(PlayerPedId())

    HideHUD(true)
    TriggerServerEvent('illenium-appearance:server:setBucket', Customize.RoutingBucket)
    Wait(500)

    local ped = SetupCapturePed(model)
    isCapturing  = true
    isPaused     = false
    isCancelled  = false
    batchCounter = 0

    SendNUIMessage({ type = 'captureStart' })
    SetNuiFocus(false, false)
    Wait(300)

    local currentCameraKey = nil
    local currentAnim      = nil
    local captured = 0

    for _, item in ipairs(items) do
        if isCancelled then break end
        WaitForResume()
        if isCancelled then break end

        local itemKey     = item.type .. '_' .. item.id
        local visParts    = visibilityMap[itemKey]
        local animConfig  = animMap[itemKey]

        ResetPedForCategory(ped, visParts, overridesMap[itemKey])
        hideHeadActive = hideHeadMap[itemKey] or false

        local cameraKey = cameraMap[itemKey] or 'torso'
        local preset    = Customize.CameraPresets[cameraKey]
        local hasSaved  = savedCameraAngles[cameraKey] ~= nil

        if cameraKey ~= currentCameraKey then
            if currentAnim then StopCategoryAnim(ped) end
            DestroyCamera()
            captureCamera    = CreateCaptureCamera(ped, preset, cameraKey)
            currentCameraKey = cameraKey
            currentAnim      = nil
        end

        if animConfig and animConfig ~= currentAnim then
            PlayCategoryAnim(ped, animConfig)
            currentAnim = animConfig
        elseif not animConfig and currentAnim then
            StopCategoryAnim(ped)
            currentAnim = nil
        end

        if item.type == 'overlay' then
            for i = 0, 12 do SetPedHeadOverlay(ped, i, 255, 1.0) end
            ApplyOverlayWithColor(ped, item.id, item.drawable)
        elseif item.type == 'component' then
            WaitForClothingLoaded(ped, item.id, item.drawable, item.texture)
        else
            WaitForPropLoaded(ped, item.id, item.drawable, item.texture)
        end

        ReapplyRotation(ped, preset, hasSaved)
        Wait(Customize.WaitAfterApply)

        local kind = item.type == 'overlay' and 'overlay' or (item.type == 'prop' and 'prop' or 'component')
        CaptureAndUpload(imageRelPath(kind, captureGender, item.id, item.drawable, item.texture or 0))
        captured = captured + 1
        SendProgress(captured, total, item.type == 'component' and tostring(item.id) or ('prop_' .. item.id))
        Wait(Customize.WaitAfterCapture)
        ThrottledWait()
    end

    local wasCancelled = isCancelled
    CleanupCapture()
    SendNUIMessage({ type = 'forceClose' })
    SendNUIMessage({ type = wasCancelled and 'captureCancelled' or 'captureComplete' })
end


local function BuildCategoryList(includeDrawables)
    local categories = {}
    for _, cat in ipairs(Customize.Categories) do
        local entry = { type = 'component', id = cat.componentId, label = cat.label, camera = cat.camera }
        if includeDrawables then entry.drawables = GetNumberOfPedDrawableVariations(PlayerPedId(), cat.componentId) end
        categories[#categories + 1] = entry
    end
    for _, cat in ipairs(Customize.PropCategories) do
        local entry = { type = 'prop', id = cat.propId, label = cat.label, camera = cat.camera }
        if includeDrawables then entry.drawables = GetNumberOfPedPropDrawableVariations(PlayerPedId(), cat.propId) end
        categories[#categories + 1] = entry
    end
    for _, cat in ipairs(Customize.OverlayCategories or {}) do
        local entry = { type = 'overlay', id = cat.overlayIndex, label = cat.label, camera = cat.camera }
        if includeDrawables then entry.drawables = GetPedHeadOverlayNum(cat.overlayIndex) end
        categories[#categories + 1] = entry
    end
    return categories
end

local function EnterCapturePreview()
    if isCapturing or isPreview then
        BeginTextCommandThefeedPost('STRING')
        AddTextComponentSubstringPlayerName('Capture already in progress!')
        EndTextCommandThefeedPostTicker(false, false)
        return
    end

    savedCameraAngles   = {}
    activePreviewCamera = nil
    isPreview           = true

    local ped = PlayerPedId()
    captureGender = GetPedGender(ped)
    SaveFullAppearance(ped)

    TriggerServerEvent('illenium-appearance:server:setBucket', Customize.RoutingBucket)
    Wait(500)
    HideHUD(true)

    ped = SetupCapturePed(pedAppearance.model)

    local categories = BuildCategoryList(true)
    CreateOrbitCamera(ped, 'preview')

    SendNUIMessage({ type = 'capturePreview', categories = categories, gender = captureGender })
    SetNuiFocus(true, true)
end

local function RunCapture(selectedComponents, selectedProps, selectedOverlays)
    captureRotOffset = math.deg(orbitAngleH) - Customize.StudioHeading
    DestroyOrbitCamera()

    isPreview    = false
    isCapturing  = true
    isPaused     = false
    isCancelled  = false
    batchCounter = 0

    local compSet, propSet = {}, {}
    for _, id in ipairs(selectedComponents) do compSet[id] = true end
    for _, id in ipairs(selectedProps) do propSet[id] = true end

    local overlaySet = {}
    for _, id in ipairs(selectedOverlays or {}) do overlaySet[id] = true end

    SendNUIMessage({ type = 'captureStart' })
    SetNuiFocus(false, false)
    Wait(300)

    if not isCancelled then
        local ped = PlayerPedId()
        CaptureComponents(ped, captureGender, compSet)
        if not isCancelled then CaptureProps(ped, captureGender, propSet) end
        if not isCancelled then CaptureOverlays(ped, captureGender, overlaySet) end
    end

    local wasCancelled = isCancelled
    CleanupCapture()
    SendNUIMessage({ type = wasCancelled and 'captureCancelled' or 'captureComplete' })
end

local function CancelPreview()
    if not isPreview then return end
    isPreview = false
    DestroyOrbitCamera()
    local ped = PlayerPedId()
    if not IsEntityVisible(ped) then SetEntityVisible(ped, true, false) end
    HideHUD(false)
    RestoreFullAppearance()
    TriggerServerEvent('illenium-appearance:server:resetBucket')
    SetNuiFocus(false, false)
end

local function CloseBrowsing()
    isBrowsing = false
    DestroyOrbitCamera()
    HideHUD(false)
    local ped = PlayerPedId()
    if not IsEntityVisible(ped) then SetEntityVisible(ped, true, false) end
    RestoreFullAppearance()
    TriggerServerEvent('illenium-appearance:server:resetBucket')
    SetNuiFocus(false, false)
end


local hideHeadActive = false

local function DrawHeadChromaMask(ped)
    if not hideHeadActive then return end
    local gs = Customize.GreenScreen
    local r, g, b = gs.color.r, gs.color.g, gs.color.b
    local hm = Customize.HeadMask or {}

    local headBone = GetPedBoneCoords(ped, 31086, 0.0, 0.0, 0.0) -- SKEL_Head

    local function drawSphere(m)
        DrawMarker(28,
            headBone.x + (m.offsetX or 0.0),
            headBone.y + (m.offsetY or 0.0),
            headBone.z + (m.offsetZ or 0.138),
            0.0, 0.0, 0.0,
            m.rotX or 0.0, m.rotY or 0.0, m.rotZ or 0.0,
            m.sizeX or 0.12, m.sizeY or 0.15, m.sizeZ or 0.31,
            r, g, b, 255,
            false, false, 2, false, nil, nil, false)
    end

    if hm[1] then
        for _, m in ipairs(hm) do drawSphere(m) end
    else
        drawSphere(hm)
    end
end


local function DrawCrosshair()
    local cx, cy = 0.5, 0.5
    local size = 0.012
    local thick = 0.001
    local a = 120
    DrawRect(cx, cy, size * 2, thick, 255, 255, 255, a)
    DrawRect(cx, cy, thick, size * 2 * (16.0/9.0), 255, 255, 255, a)
    DrawRect(cx, cy, 0.003, 0.003 * (16.0/9.0), 255, 80, 80, 200)
end


local function DrawDebugText(x, y, text)
    SetTextFont(0)
    SetTextScale(0.30, 0.30)
    SetTextColour(255, 255, 255, 230)
    SetTextDropshadow(1, 0, 0, 0, 255)
    SetTextOutline()
    SetTextEntry('STRING')
    AddTextComponentString(text)
    DrawText(x, y)
end

local function DrawCameraDebugOverlay()
    if not orbitCam then return end
    local x = 0.01
    local gap = 0.018
    local lineCount = 7
    local startY = 1.0 - 0.02 - (lineCount * gap)

    local refZ = GetEntityCoords(PlayerPedId()).z
    local zPos = orbitCenter.z - refZ

    DrawDebugText(x, startY,             ('Preset: %s'):format(activePreviewCamera or '?'))
    DrawDebugText(x, startY + gap,       ('FOV: %.1f'):format(orbitFov))
    DrawDebugText(x, startY + gap * 2,   ('Dist: %.2f'):format(orbitDist))
    DrawDebugText(x, startY + gap * 3,   ('AngleH: %.1f'):format(math.deg(orbitAngleH)))
    DrawDebugText(x, startY + gap * 4,   ('CamZ: %.2f'):format(orbitCamZ))
    DrawDebugText(x, startY + gap * 5, ('zPos: %.2f'):format(zPos))
    DrawDebugText(x, startY + gap * 6, ('Roll: %.1f'):format(orbitRoll))
end


CreateThread(function()
    while true do
        local active = isCapturing or isPreview or isBrowsing
        if active then
            local ped = PlayerPedId()
            SuppressWorld()
            ClearPedTasksImmediately(ped)
            if Customize.TransparentBg then DrawGreenScreenAndLights(ped) end
            DrawHeadChromaMask(ped)
            if (isPreview or isBrowsing) and not isCapturing then
                DrawCropOverlay()
            end
        end
        Wait(active and 0 or 1000)
    end
end)


local function OpenClothingMenu()
    if isCapturing or isPreview then return end
    isBrowsing = true

    local ped = PlayerPedId()
    captureGender = GetPedGender(ped)
    SaveFullAppearance(ped)

    TriggerServerEvent('illenium-appearance:server:setBucket', Customize.RoutingBucket)
    Wait(500)
    HideHUD(true)

    ped = SetupCapturePed(pedAppearance.model)

    local categories = BuildCategoryList(true)
    CreateOrbitCamera(ped, categories[1] and categories[1].camera or 'torso')
    SetNuiFocus(true, true)

    SendNUIMessage({
        type       = 'openMenu',
        gender     = captureGender,
        categories = categories,
        imgExt     = Customize.ScreenshotFormat or 'webp',
    })
end


RegisterNUICallback('startCapture', function(data, cb)
    cb('ok')
    if not isPreview then return end
    local sc = data.selectedComponents or {}
    local sp = data.selectedProps or {}
    local sl = data.selectedOverlays or {}
    if #sc == 0 and #sp == 0 and #sl == 0 then
        for _, cat in ipairs(Customize.Categories) do sc[#sc + 1] = cat.componentId end
        for _, cat in ipairs(Customize.PropCategories) do sp[#sp + 1] = cat.propId end
        for _, cat in ipairs(Customize.OverlayCategories or {}) do sl[#sl + 1] = cat.overlayIndex end
    end
    CreateThread(function() RunCapture(sc, sp, sl) end)
end)

RegisterNUICallback('cancelPreview', function(_, cb)
    CancelPreview()
    cb('ok')
end)

RegisterNUICallback('pauseCapture', function(_, cb)
    isPaused = true
    cb('ok')
end)

RegisterNUICallback('resumeCapture', function(_, cb)
    isPaused = false
    cb('ok')
end)

RegisterNUICallback('cancelCapture', function(_, cb)
    isCancelled = true
    isPaused = false
    cb('ok')
end)

RegisterNUICallback('closeMenu', function(_, cb)
    CloseBrowsing()
    cb('ok')
end)

RegisterNUICallback('applyClothing', function(data, cb)
    cb('ok')
    local ped = PlayerPedId()
    if data.itemType == 'component' then
        SetPedComponentVariation(ped, data.id, data.drawable, data.texture, 0)
    elseif data.itemType == 'prop' then
        if data.drawable == -1 then ClearPedProp(ped, data.id)
        else SetPedPropIndex(ped, data.id, data.drawable, data.texture, true) end
    elseif data.itemType == 'overlay' then
        for i = 0, 12 do SetPedHeadOverlay(ped, i, 255, 1.0) end
        ApplyOverlayWithColor(ped, data.id, data.drawable)
    end
end)

RegisterNUICallback('setCameraPreset', function(data, cb)
    local cam = data.camera or 'torso'
    activePreviewCamera = cam
    SetOrbitPreset(cam)

    if (isPreview or isBrowsing) and data.categoryType and data.categoryId ~= nil then
            local ped = PlayerPedId()

            local visComps = {}
            local previewDraw = 0
            local compOverrides = nil
            local shouldHideHead = false

            if data.categoryType == 'component' then
                for _, cat in ipairs(Customize.Categories) do
                    if cat.componentId == data.categoryId then
                        visComps = cat.visibleComponents or {}
                        previewDraw = cat.previewDrawable or 0
                        compOverrides = cat.componentOverrides
                        shouldHideHead = cat.hideHead or false
                        break
                    end
                end
            elseif data.categoryType == 'overlay' then
                for _, cat in ipairs(Customize.OverlayCategories or {}) do
                    if cat.overlayIndex == data.categoryId then
                        visComps = cat.visibleComponents or {}
                        compOverrides = cat.componentOverrides
                        break
                    end
                end
            else
                for _, cat in ipairs(Customize.PropCategories) do
                    if cat.propId == data.categoryId then
                        visComps = cat.visibleComponents or {}
                        previewDraw = cat.previewDrawable or 0
                        compOverrides = cat.componentOverrides
                        shouldHideHead = cat.hideHead or false
                        break
                    end
                end
            end

            hideHeadActive = shouldHideHead
            ResetPedForCategory(ped, visComps, compOverrides)
            for i = 0, 12 do SetPedHeadOverlay(ped, i, 255, 1.0) end

            if data.categoryType == 'overlay' then
                ApplyOverlayWithColor(ped, data.categoryId, 0)
            elseif data.categoryType == 'component' then
                SetPedComponentVariation(ped, data.categoryId, previewDraw, 0, 0)
            else
                SetPedPropIndex(ped, data.categoryId, previewDraw, 0, true)
            end
    end

    if savedCameraAngles[cam] then
        local saved = savedCameraAngles[cam]
        orbitAngleH   = saved.angleH
        orbitDist     = saved.dist
        orbitFov      = saved.fov
        orbitCamZ     = saved.camZ or 0.0
        orbitRoll     = saved.roll or 0.0
        if saved.zPos then
            local refZ = GetEntityCoords(PlayerPedId()).z
            orbitCenter = vector3(orbitCenter.x, orbitCenter.y, refZ + saved.zPos)
        end
        if orbitCam then SetCamFov(orbitCam, orbitFov) end
        UpdateOrbitCamera()
    end
    cb('ok')
end)

RegisterNUICallback('saveCameraAngle', function(data, cb)
    local cam = data.camera or activePreviewCamera
    if cam and orbitCam then
        local refZ = GetEntityCoords(PlayerPedId()).z
        savedCameraAngles[cam] = {
            angleH = orbitAngleH,
            dist   = orbitDist,   fov  = orbitFov,
            zPos   = orbitCenter.z - refZ,
            camZ   = orbitCamZ,   roll = orbitRoll,
        }
        cb({ saved = true, camera = cam })
    else
        cb({ saved = false })
    end
end)

RegisterNUICallback('getCameraValues', function(_, cb)
    if orbitCam then
        local refZ = GetEntityCoords(PlayerPedId()).z
        local vals = {
            preset = activePreviewCamera or '?',
            fov    = tonumber(('%.1f'):format(orbitFov)),
            dist   = tonumber(('%.2f'):format(orbitDist)),
            angleH = tonumber(('%.1f'):format(math.deg(orbitAngleH))),
            camZ   = tonumber(('%.2f'):format(orbitCamZ)),
            zPos   = tonumber(('%.2f'):format(orbitCenter.z - refZ)),
            roll   = tonumber(('%.1f'):format(orbitRoll)),
        }
        local luaStr = ('{ fov = %s, zPos = %s, rotation = vector3(0.0, 0.0, 0.0), dist = %s, defaultAngleH = %s, defaultCamZ = %s, defaultRoll = %s }'):format(
            vals.fov, vals.zPos, vals.dist, vals.angleH, vals.camZ, vals.roll)
        print(('[capturecloth] %s = %s'):format(vals.preset, luaStr))
        vals.luaFormat = luaStr
        cb(vals)
    else
        cb({})
    end
end)

RegisterNUICallback('rotateCamera', function(data, cb)
    if orbitCam then
        orbitAngleH = orbitAngleH - (data.deltaX or 0) * 0.005
        orbitCamZ   = orbitCamZ - (data.deltaY or 0) * 0.003
        UpdateOrbitCamera()
    end
    cb('ok')
end)

RegisterNUICallback('zoomCamera', function(data, cb)
    if orbitCam then
        local maxDist = 5.0
        orbitDist = math.max(0.1, math.min(maxDist, orbitDist + (data.delta or 0) * 0.1))
        UpdateOrbitCamera()
    end
    cb('ok')
end)

RegisterNUICallback('rollCamera', function(data, cb)
    if orbitCam then
        orbitRoll = orbitRoll + (data.deltaX or 0) * 0.3
        UpdateOrbitCamera()
    end
    cb('ok')
end)

RegisterNUICallback('adjustZPos', function(data, cb)
    if orbitCam then
        local delta = data.delta or 0
        orbitCenter = vector3(orbitCenter.x, orbitCenter.y, orbitCenter.z + delta)
        UpdateOrbitCamera()
    end
    cb('ok')
end)

RegisterNUICallback('adjustFov', function(data, cb)
    if orbitCam then
        orbitFov = math.max(5.0, math.min(120.0, orbitFov + (data.delta or 0)))
        SetCamFov(orbitCam, orbitFov)
    end
    cb('ok')
end)

RegisterNUICallback('resetCameraPreset', function(_, cb)
    if orbitCam and activePreviewCamera then
        SetOrbitPreset(activePreviewCamera)
    end
    cb('ok')
end)

RegisterNUICallback('getTextures', function(data, cb)
    local ped = PlayerPedId()
    local count
    if data.itemType == 'overlay' then
        count = 0
    elseif data.itemType == 'component' then
        count = GetNumberOfPedTextureVariations(ped, data.id, data.drawable)
    else
        count = GetNumberOfPedPropTextureVariations(ped, data.id, data.drawable)
    end
    cb({ count = count })
end)

RegisterNUICallback('enterRecapturePreview', function(_, cb)
    isPreview = true
    HideHUD(true)
    TriggerServerEvent('illenium-appearance:server:setBucket', Customize.RoutingBucket)
    Wait(500)

    local ped = SetupCapturePed(pedAppearance.model or GetEntityModel(PlayerPedId()))

    DestroyOrbitCamera()
    CreateOrbitCamera(ped)
    cb('ok')
end)

RegisterNUICallback('cancelRecapturePreview', function(_, cb)
    isPreview  = false
    isBrowsing = false
    DestroyOrbitCamera()
    HideHUD(false)
    RestoreFullAppearance()
    TriggerServerEvent('illenium-appearance:server:resetBucket')
    SetNuiFocus(false, false)
    cb('ok')
end)

RegisterNUICallback('recaptureItems', function(data, cb)
    cb('ok')
    local items = data.items or {}
    if #items == 0 then return end

    captureGender    = GetPedGender(PlayerPedId())
    captureRotOffset = 0.0
    isPreview        = false
    isBrowsing       = false

    local cameraMap = {}
    for _, cat in ipairs(Customize.Categories) do cameraMap['component_' .. cat.componentId] = cat.camera end
    for _, cat in ipairs(Customize.PropCategories) do cameraMap['prop_' .. cat.propId] = cat.camera end
    for _, cat in ipairs(Customize.OverlayCategories or {}) do cameraMap['overlay_' .. cat.overlayIndex] = cat.camera end

    savedCameraAngles = {}
    if orbitCam then
        local orbitState = { angleH = orbitAngleH, dist = orbitDist, fov = orbitFov, camZ = orbitCamZ, roll = orbitRoll }
        local seen = {}
        for _, item in ipairs(items) do
            local cam = cameraMap[item.type .. '_' .. item.id]
            if cam and not seen[cam] then
                savedCameraAngles[cam] = orbitState
                seen[cam] = true
            end
        end
    end

    DestroyOrbitCamera()
    CreateThread(function() RecaptureSpecificItems(items) end)
end)


RegisterCommand(Customize.Command, function() EnterCapturePreview() end, false)

exports('getPhotoURL', function(gender, itemType, id, drawable, texture)
    local kind = itemType == 'overlay' and 'overlay' or (itemType == 'prop' and 'prop' or 'component')
    return ('%s/%s.%s'):format(nuiImagesBase(), imageRelPath(kind, gender, id, drawable, texture or 0), Customize.ScreenshotFormat)
end)

exports('getShotsBaseURL', function()
    return nuiImagesBase()
end)

exports('getPhotoFormat', function()
    return Customize.ScreenshotFormat
end)


CreateThread(function()
    while true do
        local pollInput = isBrowsing or isPreview or isCapturing
        Wait(pollInput and 0 or 500)

        if isBrowsing then
            DisableControlAction(0, 1, true)
            DisableControlAction(0, 2, true)
            DisableControlAction(0, 142, true)
            DisableControlAction(0, 18, true)
            DisableControlAction(0, 322, true)
            DisableControlAction(0, 200, true)

            if IsDisabledControlJustReleased(0, 322) or IsDisabledControlJustReleased(0, 200) then
                SendNUIMessage({ type = 'forceClose' })
                CloseBrowsing()
            end

        elseif isPreview then
            DisableControlAction(0, 322, true)
            DisableControlAction(0, 200, true)
            if IsDisabledControlJustReleased(0, 322) or IsDisabledControlJustReleased(0, 200) then
                SendNUIMessage({ type = 'forceClose' })
                CancelPreview()
            end

        elseif isCapturing then
            DisableControlAction(0, 22, true)
            DisableControlAction(0, 199, true)
            DisableControlAction(0, 322, true)
            DisableControlAction(0, 200, true)
            if IsDisabledControlJustReleased(0, 22) or IsDisabledControlJustReleased(0, 199) then
                if isPaused then
                    isPaused = false
                    SendNUIMessage({ type = 'setCapturePaused', paused = false })
                else
                    isPaused = true
                    SendNUIMessage({ type = 'setCapturePaused', paused = true })
                end
            end
            if IsDisabledControlJustReleased(0, 322) or IsDisabledControlJustReleased(0, 200) then
                isCancelled = true
                isPaused = false
                SendNUIMessage({ type = 'captureCancelled' })
            end
        end
    end
end)
