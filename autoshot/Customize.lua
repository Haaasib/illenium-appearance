Customize = {}

Customize.Command           = 'capturecloth'
Customize.RoutingBucket     = 999

Customize.ScreenshotQuality = 0.75
Customize.ScreenshotFormat  = 'png'
Customize.TransparentBg     = true
Customize.ScreenshotWidth   = 512
Customize.ScreenshotHeight  = 512

Customize.StudioCoords      = vector3(0.0, 0.0, -150.0)
Customize.StudioHeading     = 180.0

Customize.WaitAfterApply    = 120
Customize.WaitAfterCapture  = 40
Customize.TextureLoadWait   = 120
Customize.CaptureAllTextures = false

Customize.BatchSize         = 30
Customize.BatchPauseWait    = 250
Customize.GCInterval        = 50
Customize.LatentRate        = 14000000

Customize.ChromaKeyColor    = 'magenta'          -- 'green' | 'magenta'

Customize.GreenScreen = {
    width       = 8.0,
    depth       = 8.0,
    height      = 8.5,
    floorOffset = -3.0,
}

Customize.HeadMask = {
    { offsetX = 0.0, offsetY = 0.0, offsetZ = 0.136, sizeX = 0.12, sizeY = 0.15, sizeZ = 0.315 },
}

Customize.GreenScreen.color = Customize.ChromaKeyColor == 'magenta'
    and { r = 255, g = 0, b = 255 }
    or  { r = 0,   g = 177, b = 64 }

Customize.StudioLights = {
    { offset = vector3(0.0, 2.5, 1.0),  range = 8.0, intensity = 3.0 },
    { offset = vector3(-2.5, 0.0, 1.0), range = 5.0, intensity = 2.0 },
    { offset = vector3(2.5, 0.0, 1.0),  range = 5.0, intensity = 2.0 },
    { offset = vector3(0.0, -1.5, 1.0), range = 4.0, intensity = 1.5 },
    { offset = vector3(0.0, 0.0, 3.0),  range = 6.0, intensity = 2.5 },
}

Customize.CameraPresets = {
    hair            = { fov = 22.0, zPos = 0.70,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 150.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    face_overlay    = { fov = 20.0, zPos = 0.68,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 150.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    chest_overlay   = { fov = 45.0, zPos = 0.30,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 155.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    mask            = { fov = 30.0, zPos = 0.65,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 150.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    arms_gloves     = { fov = 55.0, zPos = 0.30,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 155.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    legs            = { fov = 60.0, zPos = -0.46, rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 155.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    shoes           = { fov = 40.0, zPos = -0.85, rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 150.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    accessories     = { fov = 45.0, zPos = 0.30,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 155.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    body            = { fov = 45.0, zPos = 0.30,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 155.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    preview         = { fov = 40.0, zPos = 0.22,  rotation = vector3(0.0, 0.0, 0.0),   dist = 2.4, defaultAngleH = 155.0,  defaultCamZ = 0.12, defaultRoll = 0.0 },
    decals          = { fov = 40.0, zPos = 0.30,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 335.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    tops            = { fov = 55.0, zPos = 0.26,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 155.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    hats            = { fov = 30.0, zPos = 0.75,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 150.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    glasses         = { fov = 20.0, zPos = 0.70,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 150.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    ears            = { fov = 20.0, zPos = 0.675, rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 237.5,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
    watches         = { fov = 20.0, zPos = 0.03,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 59.0,   defaultCamZ = 0.0,  defaultRoll = 0.0 },
    bracelets       = { fov = 20.0, zPos = 0.03,  rotation = vector3(0.0, 0.0, 0.0),   dist = 1.2, defaultAngleH = 250.0,  defaultCamZ = 0.0,  defaultRoll = 0.0 },
}

Customize.Categories = {
    { componentId = 2,  label = 'Hair',          camera = 'hair',        visibleComponents = {0}, previewDrawable = 15 },
    { componentId = 1,  label = 'Mask',          camera = 'mask',        visibleComponents = {0, 2}, previewDrawable = 23 },
    { componentId = 3,  label = 'Arms / Gloves', camera = 'arms_gloves', visibleComponents = {}, hideHead = true },
    { componentId = 4,  label = 'Pants',         camera = 'legs',        visibleComponents = {} },
    { componentId = 5,  label = 'Bags',          camera = 'decals',      visibleComponents = {}, previewDrawable = 1, hideHead = true },
    { componentId = 6,  label = 'Shoes',         camera = 'shoes',       visibleComponents = {}, previewDrawable = 1 },
    { componentId = 7,  label = 'Accessories',   camera = 'accessories', visibleComponents = {0, 3}, componentOverrides = {[3] = 15}, hideHead = true },
    { componentId = 8,  label = 'Undershirt',    camera = 'tops',        visibleComponents = {}, hideHead = true },
    { componentId = 9,  label = 'Body Armor',    camera = 'body',        visibleComponents = {}, previewDrawable = 1, hideHead = true },
    { componentId = 10, label = 'Decals',        camera = 'decals',      visibleComponents = {3}, componentOverrides = {[3] = 15}, hideHead = true },
    { componentId = 11, label = 'Tops',          camera = 'tops',        visibleComponents = {}, hideHead = true },
}

Customize.PropCategories = {
    { propId = 0, label = 'Hats',      camera = 'hats',      visibleComponents = {0, 2} },
    { propId = 1, label = 'Glasses',   camera = 'glasses',   visibleComponents = {0, 2}, previewDrawable = 2 },
    { propId = 2, label = 'Ears',      camera = 'ears',      visibleComponents = {0, 2} },
    { propId = 6, label = 'Watches',   camera = 'watches',   visibleComponents = {3}, anim = { dict = 'anim@heists@ornate_bank@grab_cash', name = 'grab', flag = 49 } },
    { propId = 7, label = 'Bracelets', camera = 'bracelets', visibleComponents = {3}, anim = { dict = 'anim@heists@ornate_bank@grab_cash', name = 'grab', flag = 49 } },
}

Customize.OverlayCategories = {
    { overlayIndex = 0,  label = 'Blemishes',          camera = 'face_overlay',  visibleComponents = {0, 2}, colorType = 1, colorId = 1 },
    { overlayIndex = 1,  label = 'Facial Hair',        camera = 'face_overlay',  visibleComponents = {0, 2}, colorType = 1, colorId = 1 },
    { overlayIndex = 2,  label = 'Eyebrows',           camera = 'face_overlay',  visibleComponents = {0, 2}, colorType = 1, colorId = 1 },
    { overlayIndex = 3,  label = 'Ageing',             camera = 'face_overlay',  visibleComponents = {0, 2}, colorType = 1, colorId = 1 },
    { overlayIndex = 4,  label = 'Makeup',             camera = 'face_overlay',  visibleComponents = {0, 2}, colorType = 2, colorId = 1 },
    { overlayIndex = 5,  label = 'Blush',              camera = 'face_overlay',  visibleComponents = {0, 2}, colorType = 2, colorId = 1 },
    { overlayIndex = 6,  label = 'Complexion',         camera = 'face_overlay',  visibleComponents = {0, 2}, colorType = 1, colorId = 1 },
    { overlayIndex = 7,  label = 'Sun Damage',         camera = 'face_overlay',  visibleComponents = {0, 2}, colorType = 1, colorId = 1 },
    { overlayIndex = 8,  label = 'Lipstick',           camera = 'face_overlay',  visibleComponents = {0, 2}, colorType = 2, colorId = 1 },
    { overlayIndex = 9,  label = 'Moles & Freckles',   camera = 'face_overlay',  visibleComponents = {0, 2}, colorType = 1, colorId = 1 },
    { overlayIndex = 10, label = 'Chest Hair',         camera = 'chest_overlay', visibleComponents = {0, 2, 3}, componentOverrides = {[3] = 15}, colorType = 1, colorId = 1 },
    { overlayIndex = 11, label = 'Body Blemishes',     camera = 'chest_overlay', visibleComponents = {0, 2, 3}, componentOverrides = {[3] = 15}, colorType = 1, colorId = 1 },
}

Customize.ImageFolder = 'images'

Customize.ComponentFolders = {
    [1] = 'masks',
    [2] = 'hair',
    [3] = 'torsos',
    [4] = 'legs',
    [5] = 'bags',
    [6] = 'shoes',
    [7] = 'accessories',
    [8] = 'undershirts',
    [9] = 'bodyarmors',
    [10] = 'decals',
    [11] = 'tops',
}

Customize.PropFolders = {
    [0] = 'hats',
    [1] = 'glasses',
    [2] = 'ears',
    [6] = 'watches',
    [7] = 'bracelets',
}

Customize.OverlayFolders = {
    [0] = 'blemishes',
    [1] = 'beards',
    [2] = 'eyebrows',
    [3] = 'ageing',
    [4] = 'makeup',
    [5] = 'blush',
    [6] = 'complexion',
    [7] = 'sun_damage',
    [8] = 'lipstick',
    [9] = 'moles',
    [10] = 'chest_hair',
    [11] = 'body_blemishes',
}

if Config and Config.CaptureCloth then
    local cap = Config.CaptureCloth
    if cap.Command then Customize.Command = cap.Command end
    if cap.StudioCoords then Customize.StudioCoords = cap.StudioCoords end
    if cap.StudioHeading then Customize.StudioHeading = cap.StudioHeading end
    if cap.WaitAfterApply then Customize.WaitAfterApply = cap.WaitAfterApply end
    if cap.WaitAfterCapture then Customize.WaitAfterCapture = cap.WaitAfterCapture end
    if cap.TextureLoadWait then Customize.TextureLoadWait = cap.TextureLoadWait end
    if cap.CaptureAllTextures ~= nil then Customize.CaptureAllTextures = cap.CaptureAllTextures end
    if cap.ScreenshotEncoding then Customize.ScreenshotFormat = cap.ScreenshotEncoding end
    if cap.Enabled == false then
        Customize.Command = 'capturecloth_disabled'
    end
end
