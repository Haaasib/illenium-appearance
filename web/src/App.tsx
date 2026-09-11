import React, { useState, useEffect, useCallback } from 'react';
import Nui from './Nui';

import Navigation, { MAIN_TABS } from './components/Navigation';
import Sidebar from './components/Sidebar';
import Grid from './components/Grid';
import Sliders from './components/Sliders';
import CustomizationPanel from './components/CustomizationPanel';
import EconomyWidget from './components/EconomyWidget';
import SavedOutfits from './components/SavedOutfits';
import { RotateCcwIcon } from './components/icons/AnimatedIcons';
import { ClothingImages, ClothingPrices } from './utils';
import Keybinds from './components/Keybinds';

export default function App() {
  const [visible, setVisible] = useState(typeof (window as any).invokeNative === 'undefined');
  const [appearanceData, setAppearanceData] = useState<any>(null);
  const [appearanceSettings, setAppearanceSettings] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [activeMainTab, setActiveMainTab] = useState(0);
  const [navPath, setNavPath] = useState<string[]>(['APPAREL']);
  const [money, setMoney] = useState({ cash: 0, bank: 0 });
  const [totalCost, setTotalCost] = useState(0);
  const [selectedItem, setSelectedItem] = useState<any>(null); // tracks clicked Grid item
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const initialAppearanceRef = React.useRef<any>(null);
  const isFree = !!config?.isFree;
  const prices: ClothingPrices | undefined = config?.prices;
  const images: ClothingImages | undefined = config?.images;

  const availableMainTabs = React.useMemo(() => {
    if (!config) return ['APPAREL'];
    const tabs: string[] = [];
    if (config.ped) tabs.push('PEDS');
    if (config.headBlend) tabs.push('FACE & BODY');
    if (config.faceFeatures) tabs.push('FACE ADJUSTMENTS');
    if (config.headOverlays) {
      tabs.push('OVERLAYS');
      tabs.push('HAIR');
    }
    if (config.components || config.props) tabs.push('APPAREL');
    if (config.tattoos) tabs.push('TATTOOS');
    return tabs.length > 0 ? tabs : ['APPAREL'];
  }, [config]);

  const tabsRef = React.useRef(availableMainTabs);
  useEffect(() => {
    tabsRef.current = availableMainTabs;
  }, [availableMainTabs]);

  useEffect(() => {
    if (availableMainTabs.length > 0) {
      const apparelIdx = availableMainTabs.indexOf('APPAREL');
      const targetIdx = apparelIdx !== -1 ? apparelIdx : 0;
      setActiveMainTab(targetIdx);
      const tabName = availableMainTabs[targetIdx];
      setNavPath(diveIntoTab(tabName));
    }
  }, [availableMainTabs]);

  const handleSetNavPath = (path: string[]) => {
    setNavPath(path);
    setSelectedItem(null); // reset selection on navigation

    // Auto adjust camera
    const target = (path[path.length - 1] || '').toUpperCase();
    const root = (path[0] || '').toUpperCase();
    if (root === 'HAIR' || root === 'OVERLAYS' || root === 'FACE & BODY' || root === 'FACE ADJUSTMENTS' || target.includes('HEAD') || target.includes('MASK') || target.includes('HAT') || target.includes('GLASS') || target.includes('EAR')) {
      Nui.post('appearance_set_camera', 'head');
    } else if (target.includes('BOTTOM') || target.includes('LEG')) {
      Nui.post('appearance_set_camera', 'bottoms');
    } else if (target.includes('SHOE') || target.includes('FOOT')) {
      Nui.post('appearance_set_camera', 'shoes');
    } else if (target.includes('TOP') || target.includes('SHIRT') || target.includes('ARMOR') || target.includes('BAG') || target.includes('DECAL') || target.includes('GLOVE')) {
      Nui.post('appearance_set_camera', 'body');
    } else {
      Nui.post('appearance_set_camera', 'character');
    }
  };

  const COMPONENT_MAP: Record<string, number> = {
    'TOPS': 11,
    'UNDERSHIRTS': 8,
    'TORSOS': 3,
    'BOTTOMS': 4,
    'LEGS': 4,
    'SHOES': 6,
    'FOOTWEAR': 6,
    'BAGS & PARACHUTES': 5,
    'BAGS': 5,
    'ACCESSORIES': 7,
    'BODY ARMORS': 9,
    'BODY ARMOR': 9,
    'DECALS': 10,
    'MASKS': 1,
    'GLOVES': 3,
  };

  const PROP_MAP: Record<string, number> = {
    'HATS': 0,
    'GLASSES': 1,
    'EARS': 2,
    'WATCHES': 6,
    'BRACELETS': 7,
  };

  const OVERLAY_MAP: Record<string, string> = {
    'FACIAL HAIR': 'beard',
    'EYEBROWS': 'eyebrows',
    'CHEST HAIR': 'chestHair',
    'BLEMISHES': 'blemishes',
    'AGEING': 'ageing',
    'COMPLEXION': 'complexion',
    'SUN DAMAGE': 'sunDamage',
    'MOLES & FRECKLES': 'moleAndFreckles',
    'BODY BLEMISHES': 'bodyBlemishes',
    'MAKEUP': 'makeUp',
    'BLUSH': 'blush',
    'LIPSTICK': 'lipstick',
  };

  const diveIntoTab = (tab: string) => {
    if (tab === 'HAIR') return ['HAIR', 'STYLES'];
    if (tab === 'OVERLAYS') return ['OVERLAYS', 'FACIAL HAIR'];
    if (tab === 'FACE & BODY') return ['FACE & BODY'];
    return [tab];
  };

  // Fetch initial data
  useEffect(() => {
    const applyTheme = (themeData: any) => {
      if (!themeData) return;
      const currentKey = themeData.currentTheme || 'default';
      let activeThemeObj = null;

      if (currentKey === 'custom' && themeData.custom) {
        activeThemeObj = themeData.custom;
      } else if (Array.isArray(themeData.themes)) {
        activeThemeObj = themeData.themes.find((t: any) => t.id === currentKey);
      }

      if (!activeThemeObj && Array.isArray(themeData.themes)) {
        activeThemeObj = themeData.themes[0];
      }

      if (activeThemeObj) {
        const root = document.documentElement;
        if (activeThemeObj.fontTitle) root.style.setProperty('--font-title', `'${activeThemeObj.fontTitle}', sans-serif`);
        if (activeThemeObj.fontBody) root.style.setProperty('--font-body', `'${activeThemeObj.fontBody}', sans-serif`);
        if (activeThemeObj.headerBg) root.style.setProperty('--header-bg', activeThemeObj.headerBg);
        if (activeThemeObj.headerText) root.style.setProperty('--header-text', activeThemeObj.headerText);
        if (activeThemeObj.accentColor) root.style.setProperty('--accent-color', activeThemeObj.accentColor);
        if (activeThemeObj.accentText) root.style.setProperty('--accent-text', activeThemeObj.accentText);
        if (activeThemeObj.cardBg) root.style.setProperty('--card-bg', activeThemeObj.cardBg);
        if (activeThemeObj.cardBorder) root.style.setProperty('--card-border', activeThemeObj.cardBorder);
        if (activeThemeObj.mainTextColor) root.style.setProperty('--main-text', activeThemeObj.mainTextColor);
        if (activeThemeObj.subTextColor) root.style.setProperty('--sub-text', activeThemeObj.subTextColor);
      }
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'appearance_display') {
        setVisible(true);
        setTotalCost(0);
        setSelectedItem(null);
        setShowPaymentModal(false);
        Nui.post('appearance_set_camera', 'character');
        Nui.post('appearance_get_data').then(res => {
          if (res) {
            setAppearanceData(res.appearanceData);
            initialAppearanceRef.current = res.appearanceData
              ? JSON.parse(JSON.stringify(res.appearanceData))
              : null;
            setConfig({ ...(res.config || {}), isFree: res.isFree === true || res.config?.isFree === true });
            if (res.appearanceSettings) setAppearanceSettings(res.appearanceSettings);
            if (res.money) setMoney(res.money);
            if (res.theme) applyTheme(res.theme);
          }
        });
      } else if (event.data.type === 'appearance_hide') {
        setVisible(false);
      } else if (event.data.type === 'appearance_update') {
        if (event.data.payload) {
          setAppearanceData((prev: any) => ({ ...prev, ...event.data.payload }));
        }
      }
    };
    window.addEventListener('message', handleMessage);

    if (typeof (window as any).invokeNative === 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const freeMode = params.get('free') === '1';
      setConfig({
        ped: true,
        headBlend: true,
        faceFeatures: true,
        headOverlays: true,
        components: true,
        props: true,
        tattoos: true,
        isFree: freeMode,
        prices: {
          Default: 100,
          Texture: 10,
          Color: 10,
          Overlay: 50,
          FaceFeature: 10,
          HeadBlend: 10,
          Hair: 100,
          EyeColor: 50,
          Tattoo: 100,
          Components: {
            Masks: 80,
            UpperBody: 50,
            LowerBody: 120,
            Bags: 90,
            Shoes: 90,
            ScarfAndChains: 60,
            BodyArmor: 150,
            Shirts: 70,
            Decals: 40,
            Jackets: 150,
          },
          Props: {
            Hats: 80,
            Glasses: 60,
            Ear: 40,
            Watches: 70,
            Bracelets: 50,
          },
        },
        images: {},
      });
      setAppearanceData({
        model: 'mp_m_freemode_01',
        components: [],
        props: [],
        hair: { style: 0, color: 0, highlight: 0 },
      });
      setMoney({ cash: 5000, bank: 10000 });
    }

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  const handleResetAppearance = useCallback(() => {
    if (!initialAppearanceRef.current) return;
    const initial = JSON.parse(JSON.stringify(initialAppearanceRef.current));
    setAppearanceData(initial);
    setTotalCost(0);
    setSelectedItem(null);

    if (initial.model) {
      Nui.post('appearance_change_model', initial.model).then((res: any) => {
        if (res?.appearanceSettings) setAppearanceSettings(res.appearanceSettings);
        if (initial.components) {
          initial.components.forEach((c: any) => {
            Nui.post('appearance_change_component', c);
          });
        }
        if (initial.props) {
          initial.props.forEach((p: any) => {
            Nui.post('appearance_change_prop', p);
          });
        }
        if (initial.headBlend) {
          Nui.post('appearance_change_head_blend', initial.headBlend);
        }
        if (initial.faceFeatures) {
          Nui.post('appearance_change_face_feature', initial.faceFeatures);
        }
        if (initial.headOverlays) {
          Nui.post('appearance_change_head_overlay', initial.headOverlays);
        }
        if (initial.hair) {
          Nui.post('appearance_change_hair', initial.hair);
        }
      });
    }
  }, []);
    
  // Keybinds & mouse controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return;

      // Don't intercept if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        }
        return;
      }

      const key = e.key.toLowerCase();

      // Camera Up / Down (W / S / ArrowUp / ArrowDown)
      if (key === 'w' || e.key === 'ArrowUp') {
        Nui.post('appearance_adjust_camera', 'up');
      } else if (key === 's' || e.key === 'ArrowDown') {
        Nui.post('appearance_adjust_camera', 'down');
      }

      // Ped Rotate Left / Right (A / D / ArrowLeft / ArrowRight)
      if (key === 'a' || e.key === 'ArrowLeft') {
        Nui.post('rotate_left');
      } else if (key === 'd' || e.key === 'ArrowRight') {
        Nui.post('rotate_right');
      }

      // Tab Navigation (Q / E)
      if (key === 'q') {
        const tabs = tabsRef.current;
        if (tabs.length > 1) {
          setActiveMainTab((prev) => {
            const newIdx = prev > 0 ? prev - 1 : prev;
            handleSetNavPath(diveIntoTab(tabs[newIdx]));
            return newIdx;
          });
        }
      } else if (key === 'e') {
        const tabs = tabsRef.current;
        if (tabs.length > 1) {
          setActiveMainTab((prev) => {
            const newIdx = prev < tabs.length - 1 ? prev + 1 : prev;
            handleSetNavPath(diveIntoTab(tabs[newIdx]));
            return newIdx;
          });
        }
      }

      // Exit & Save
      if (e.key === 'Escape') {
        if (showPaymentModal) {
          setShowPaymentModal(false);
          return;
        }
        Nui.post('appearance_exit');
        setVisible(false);
      }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (isFree) {
          Nui.post('appearance_save', { paymentMethod: 'cash', cost: 0 });
          setShowPaymentModal(false);
          setVisible(false);
        } else {
          setShowPaymentModal(true);
        }
      }
    };
    const isDragging = { current: false };
    let lastMouseX = 0;

    const handleWindowMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement)?.closest('button, input, select, textarea, .styled-scrollbar')) return;
      isDragging.current = true;
      lastMouseX = e.clientX;
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const deltaX = e.clientX - lastMouseX;
      if (Math.abs(deltaX) > 6) {
        if (deltaX > 0) {
          Nui.post('rotate_right');
        } else {
          Nui.post('rotate_left');
        }
        lastMouseX = e.clientX;
      }
    };

    const handleWindowMouseUp = () => {
      isDragging.current = false;
    };

    const handleWindowWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement)?.closest('.styled-scrollbar')) return;
      if (e.deltaY < 0) {
        Nui.post('appearance_adjust_camera', 'zoom_in');
      } else {
        Nui.post('appearance_adjust_camera', 'zoom_out');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleWindowMouseDown);
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    window.addEventListener('wheel', handleWindowWheel, { passive: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleWindowMouseDown);
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
      window.removeEventListener('wheel', handleWindowWheel);
    };
  }, [visible, showPaymentModal, isFree]);


  if (!visible) return null;

  const handleSidebarSelect = (item: string) => {
    // If we are at the root of APPAREL, and we clicked a folder, go into it.
    if (activeCategory === 'APPAREL' && navPath.length === 1) {
      setNavPath([activeCategory, item]);
      return;
    }
    // Otherwise, we clicked a leaf node
    if (navPath.length === 2 && activeCategory === 'APPAREL') {
      setNavPath([activeCategory, navPath[1], item]);
      return;
    }
    
    setNavPath([activeCategory, item]);
  };

  const getSubcategories = (mainTab: string) => {
    let listItems: any[] = [];
    if (mainTab === 'APPAREL') {
      if (navPath.length === 1) {
        listItems = [
          { label: 'OUTFITS', icon: 'IconTShirt' },
          { label: 'CLOTHING', icon: 'IconTShirt' },
          { label: 'UPPER BODY ACCESSORIES', icon: 'IconUpperBody' },
          { label: 'HAND & WRIST ACCESSORIES', icon: 'IconGloves' },
          { label: 'HEAD ACCESSORIES', icon: 'IconHat' }
        ];
      } else if (navPath[1] === 'CLOTHING') {
        listItems = [
          { label: 'TOPS', icon: 'IconTShirt' },
          { label: 'UNDERSHIRTS', icon: 'IconTShirt' },
          { label: 'BOTTOMS', icon: 'IconPants' },
          { label: 'SHOES', icon: 'IconShoes' }
        ];
      } else if (navPath[1] === 'UPPER BODY ACCESSORIES') {
        listItems = [
          { label: 'BODY ARMOR', icon: 'IconUpperBody' },
          { label: 'BAGS & PARACHUTES', icon: 'IconBag' },
          { label: 'DECALS', icon: 'IconTShirt' }
        ];
      } else if (navPath[1] === 'HAND & WRIST ACCESSORIES') {
        listItems = [
          { label: 'GLOVES', icon: 'IconGloves' },
          { label: 'WATCHES', icon: 'IconWatch' },
          { label: 'BRACELETS', icon: 'IconWatch' }
        ];
      } else if (navPath[1] === 'HEAD ACCESSORIES') {
        listItems = [
          { label: 'MASKS', icon: 'IconHat' },
          { label: 'HATS', icon: 'IconHat' },
          { label: 'GLASSES', icon: 'IconHat' },
          { label: 'EARS', icon: 'IconHat' }
        ];
      }
    } else if (mainTab === 'FACE & BODY') {
      listItems = [
        { label: 'HEAD BLEND', icon: 'IconTShirt' },
        { label: 'EYE COLOR', icon: 'IconTShirt' },
        { label: 'FACE FEATURES', icon: 'IconTShirt' }
      ];
    } else if (mainTab === 'PEDS') {
      listItems = [
        { label: 'PED MODELS', icon: 'IconTShirt' }
      ];
    } else if (mainTab === 'FACE ADJUSTMENTS') {
      listItems = [
        { label: 'NOSE', icon: 'IconTShirt' },
        { label: 'BROW', icon: 'IconTShirt' },
        { label: 'EYES', icon: 'IconTShirt' },
        { label: 'CHEEKS', icon: 'IconTShirt' },
        { label: 'LIPS & JAW', icon: 'IconTShirt' },
        { label: 'CHIN & NECK', icon: 'IconTShirt' }
      ];
    } else if (mainTab === 'OVERLAYS') {
      listItems = [
        { label: 'BLEMISHES', icon: 'IconTShirt' },
        { label: 'AGEING', icon: 'IconTShirt' },
        { label: 'COMPLEXION', icon: 'IconTShirt' },
        { label: 'SUN DAMAGE', icon: 'IconTShirt' },
        { label: 'MOLES & FRECKLES', icon: 'IconTShirt' },
        { label: 'BODY BLEMISHES', icon: 'IconTShirt' },
        { label: 'MAKEUP', icon: 'IconTShirt' },
        { label: 'BLUSH', icon: 'IconTShirt' },
        { label: 'LIPSTICK', icon: 'IconTShirt' },
        { label: 'FACIAL HAIR', icon: 'IconTShirt' },
        { label: 'EYEBROWS', icon: 'IconTShirt' },
        { label: 'CHEST HAIR', icon: 'IconTShirt' }
      ];
    } else if (mainTab === 'HAIR') {
      listItems = [
        { label: 'STYLES', icon: 'IconTShirt' },
        { label: 'FACIAL HAIR', icon: 'IconTShirt' },
        { label: 'EYEBROWS', icon: 'IconTShirt' },
        { label: 'CHEST HAIR', icon: 'IconTShirt' }
      ];
    } else if (mainTab === 'TATTOOS') {
      listItems = [
        { label: 'HEAD', icon: 'IconTShirt' },
        { label: 'TORSO', icon: 'IconTShirt' },
        { label: 'LEFT ARM', icon: 'IconTShirt' },
        { label: 'RIGHT ARM', icon: 'IconTShirt' },
        { label: 'LEFT LEG', icon: 'IconTShirt' },
        { label: 'RIGHT LEG', icon: 'IconTShirt' }
      ];
    }
    return listItems;
  };

  const activeCategory = navPath[navPath.length - 1];
  let itemsToRender: any[] = [];
  let activeItem: any = null;
  let itemType = 'component';
  let itemId = 0;

  // Determine view mode based on category
  const getCategoryViewMode = (cat: string) => {
    if (
      COMPONENT_MAP[cat] !== undefined ||
      PROP_MAP[cat] !== undefined ||
      OVERLAY_MAP[cat] !== undefined ||
      cat === 'EYE COLOR' ||
      cat === 'HAIRSTYLE' ||
      cat === 'STYLES' ||
      cat === 'PEDS' ||
      cat === 'PED MODELS' ||
      cat === 'PED' ||
      navPath[0] === 'TATTOOS'
    ) return 'grid';
    return 'slider';
  };

  const viewMode = getCategoryViewMode(activeCategory);

  if (viewMode === 'grid') {
    if (COMPONENT_MAP[activeCategory] !== undefined) {
      itemType = 'component';
      itemId = COMPONENT_MAP[activeCategory];
      let max = 150;
      if (appearanceSettings?.components && appearanceSettings.components[itemId]) {
        max = (appearanceSettings.components[itemId]?.drawable?.max || 150) + 1;
      }
      itemsToRender = Array.from({length: Math.max(max, 30)}).map((_, i) => ({ drawable: i, texture: 0 }));
      if (appearanceData && appearanceData.components) {
        activeItem = appearanceData.components.find((c: any) => c.component_id === itemId);
      }
      if (!activeItem) {
        activeItem = { component_id: itemId, drawable: 0, texture: 0 };
      }
    } else if (PROP_MAP[activeCategory] !== undefined) {
      itemType = 'prop';
      itemId = PROP_MAP[activeCategory];
      let max = 60;
      if (appearanceSettings?.props && appearanceSettings.props[itemId]) {
        max = (appearanceSettings.props[itemId]?.drawable?.max || 60) + 1;
      }
      itemsToRender = Array.from({length: Math.max(max, 20)}).map((_, i) => ({ drawable: i, texture: 0 }));
      if (appearanceData && appearanceData.props) {
        activeItem = appearanceData.props.find((p: any) => p.prop_id === itemId);
      }
      if (!activeItem) {
        activeItem = { prop_id: itemId, drawable: 0, texture: 0 };
      }
    } else if (activeCategory === 'EYE COLOR') {
      itemType = 'eye_color';
      itemsToRender = Array.from({length: 32}).map((_, i) => ({ drawable: i, texture: 0 }));
      activeItem = { drawable: appearanceData?.eyeColor || 0 };
    } else if (OVERLAY_MAP[activeCategory]) {
      itemType = 'overlay';
      const overlayKey = OVERLAY_MAP[activeCategory];
      let max = 28;
      if (appearanceSettings?.headOverlays?.[overlayKey]?.style) {
        max = (appearanceSettings.headOverlays[overlayKey].style.max || 28) + 1;
      }
      itemsToRender = Array.from({ length: Math.max(max, 8) }).map((_, i) => ({
        drawable: i,
        texture: 0,
        overlayKey,
      }));
      const ov = appearanceData?.headOverlays?.[overlayKey];
      activeItem = { drawable: ov?.style || 0, overlayKey };
    } else if (activeCategory === 'HAIRSTYLE' || activeCategory === 'STYLES') {
      itemType = 'hair';
      itemId = 2;
      let max = 76;
      if (appearanceSettings?.hair?.style) {
        max = (appearanceSettings.hair.style.max || 76) + 1;
      }
      itemsToRender = Array.from({length: Math.max(max, 30)}).map((_, i) => ({ drawable: i, texture: 0 }));
      activeItem = { drawable: appearanceData?.hair?.style || 0 };
    } else if (activeCategory === 'PEDS' || activeCategory === 'PED MODELS' || activeCategory === 'PED') {
      itemType = 'ped_model';
      const defaultPeds = ["mp_m_freemode_01", "mp_f_freemode_01"];
      const rawItems = appearanceSettings?.ped?.model?.items || [
        "a_c_boar", "a_c_boar_02", "a_c_cat_01", "a_c_chop", "a_m_y_skater_01", "a_m_y_hipster_01", "ig_bankman", "a_f_m_beach_01"
      ];
      const pedItems = Array.from(new Set([...defaultPeds, ...rawItems]));
      itemsToRender = pedItems.map((pedName: string, i: number) => ({
        drawable: i,
        texture: 0,
        model: pedName,
        name: pedName
      }));
      activeItem = { model: appearanceData?.model || 'mp_m_freemode_01' };
    } else if (navPath[0] === 'TATTOOS') {
      itemType = 'tattoo';
      const zoneKeysMap: Record<string, string[]> = {
        'HEAD': ['ZONE_HEAD', 'head', 'HEAD'],
        'TORSO': ['ZONE_TORSO', 'torso', 'TORSO'],
        'LEFT ARM': ['ZONE_LEFT_ARM', 'leftArm', 'left_arm', 'LEFT_ARM'],
        'RIGHT ARM': ['ZONE_RIGHT_ARM', 'rightArm', 'right_arm', 'RIGHT_ARM'],
        'LEFT LEG': ['ZONE_LEFT_LEG', 'leftLeg', 'left_leg', 'LEFT_LEG'],
        'RIGHT LEG': ['ZONE_RIGHT_LEG', 'rightLeg', 'right_leg', 'RIGHT_LEG']
      };
      const keysToTry = zoneKeysMap[activeCategory] || ['ZONE_TORSO', 'torso', 'TORSO'];
      let rawTattoos: any[] = [];
      const tattooItemsObj = appearanceSettings?.tattoos?.items || {};
      for (const k of keysToTry) {
        if (Array.isArray(tattooItemsObj[k]) && tattooItemsObj[k].length > 0) {
          rawTattoos = tattooItemsObj[k];
          break;
        }
      }
      itemsToRender = rawTattoos.map((t: any, i: number) => ({
        ...t,
        drawable: i,
        texture: 0
      }));
    }
  }

  const gender: 'male' | 'female' = (appearanceData?.model === 'mp_f_freemode_01' || appearanceData?.model === 1885233650) ? 'female' : 'male';

  const isSelectedItemForCurrentCategory = 
    selectedItem && (
      (itemType === 'component' && selectedItem.component_id === itemId) ||
      (itemType === 'prop' && selectedItem.prop_id === itemId) ||
      (itemType === 'overlay' && selectedItem.overlayKey === activeItem?.overlayKey) ||
      (itemType === 'hair' && selectedItem.drawable !== undefined)
    );
  const currentActiveItem = isSelectedItemForCurrentCategory ? selectedItem : activeItem;

  const handleItemSelect = (item: any) => {
    setSelectedItem(item);
    setAppearanceData((prev: any) => {
      if (!prev) return prev;
      if (itemType === 'component') {
        const components = [...(prev.components || [])];
        const idx = components.findIndex((c: any) => c.component_id === itemId);
        if (idx !== -1) {
          components[idx] = { ...components[idx], drawable: item.drawable, texture: item.texture || 0 };
        } else {
          components.push({ component_id: itemId, drawable: item.drawable, texture: item.texture || 0 });
        }
        return { ...prev, components };
      } else if (itemType === 'prop') {
        const props = [...(prev.props || [])];
        const idx = props.findIndex((p: any) => p.prop_id === itemId);
        if (idx !== -1) {
          props[idx] = { ...props[idx], drawable: item.drawable, texture: item.texture || 0 };
        } else {
          props.push({ prop_id: itemId, drawable: item.drawable, texture: item.texture || 0 });
        }
        return { ...prev, props };
      } else if (itemType === 'ped_model') {
        if (item.headBlend || item.components) {
          return item;
        }
        return { ...prev, model: item.model || item.name };
      } else if (itemType === 'hair') {
        const hair = {
          ...(prev?.hair || {}),
          style: item.drawable,
          color: prev?.hair?.color ?? 0,
          highlight: prev?.hair?.highlight ?? 0,
          texture: item.texture || 0
        };
        return { ...prev, hair };
      } else if (itemType === 'overlay' && item.overlayKey) {
        const current = prev.headOverlays?.[item.overlayKey] || {};
        return {
          ...prev,
          headOverlays: {
            ...(prev.headOverlays || {}),
            [item.overlayKey]: {
              ...current,
              style: item.drawable,
              opacity: current.opacity ?? 1,
              color: current.color || 0,
              secondColor: current.secondColor || 0,
            },
          },
        };
      }
      return prev;
    });
  };

  const handleTextureSelect = (tex: number) => {
    setSelectedItem((prev: any) => ({
      ...(prev || currentActiveItem),
      texture: tex,
    }));
    setAppearanceData((prev: any) => {
      if (!prev) return prev;
      if (itemType === 'component') {
        const components = [...(prev.components || [])];
        const idx = components.findIndex((c: any) => c.component_id === itemId);
        if (idx !== -1) {
          components[idx] = { ...components[idx], texture: tex };
        }
        return { ...prev, components };
      } else if (itemType === 'prop') {
        const props = [...(prev.props || [])];
        const idx = props.findIndex((p: any) => p.prop_id === itemId);
        if (idx !== -1) {
          props[idx] = { ...props[idx], texture: tex };
        }
        return { ...prev, props };
      }
      return prev;
    });
  };

  const handleConfirmPayment = (paymentMethod: 'cash' | 'card') => {
    Nui.post('appearance_save', { paymentMethod, cost: isFree ? 0 : totalCost });
    setShowPaymentModal(false);
    setVisible(false);
  };

  const handleConfirm = () => {
    if (isFree) {
      handleConfirmPayment('cash');
      return;
    }
    setShowPaymentModal(true);
  };

  const renderKeybinds = () => (
    <Keybinds checkoutLabel={isFree ? 'SAVE' : 'CHECKOUT'} />
  );

  return (
    <div className="relative w-full h-screen overflow-hidden bg-transparent text-white antialiased select-none">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700&family=Bebas+Neue&family=Inter:wght@400;600;700&family=Montserrat:wght@400;600;700&family=Oswald:wght@400;500;700&family=Poppins:wght@400;600;700&family=Roboto:wght@400;500;700&display=swap');
        :root {
          --font-title: 'Bebas Neue', sans-serif;
          --font-body: 'Oswald', sans-serif;
          --font-barlow: 'Barlow Condensed', sans-serif;
        }
        .font-bebas { font-family: var(--font-title); }
        .font-oswald { font-family: var(--font-body); }
        .font-barlow { font-family: var(--font-barlow); }
        .styled-scrollbar::-webkit-scrollbar { width: 4px; }
        .styled-scrollbar::-webkit-scrollbar-track { background: #111; }
        .styled-scrollbar::-webkit-scrollbar-thumb { background: #333; }
        .styled-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>

      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        <div className="flex justify-between items-start pt-6 px-12 pointer-events-auto select-none w-full">
          <Navigation 
            tabs={availableMainTabs}
            activeMainTab={activeMainTab} 
            onSelectTab={(idx, tab) => {
              setActiveMainTab(idx);
              handleSetNavPath(diveIntoTab(tab));
            }} 
          />
          <EconomyWidget cash={money.cash} bank={money.bank} />
        </div>
        
        <main className="flex-1 flex justify-between w-full h-full relative">
          {activeCategory === 'SAVED OUTFITS' || (navPath[0] === 'APPAREL' && navPath[1] === 'OUTFITS') ? (
            <SavedOutfits 
              navPath={navPath} 
              setNavPath={handleSetNavPath} 
              onOutfitApplied={() => {
                Nui.post('appearance_get_data').then(res => {
                  if (res?.appearanceData) setAppearanceData(res.appearanceData);
                });
              }}
            />
          ) : (navPath[0] === 'APPAREL' ? navPath.length <= 2 : navPath.length <= 1) ? (
            <Sidebar 
              navPath={navPath} 
              setNavPath={handleSetNavPath} 
              categories={getSubcategories(navPath[0])} 
            />
          ) : viewMode === 'grid' ? (
            <Grid 
              navPath={navPath}
              setNavPath={handleSetNavPath}
              activeCategory={activeCategory}
              itemType={itemType}
              itemId={itemId}
              itemsToRender={itemsToRender}
              activeItem={currentActiveItem}
              setTotalCost={setTotalCost}
              gender={gender}
              appearanceData={appearanceData}
              onItemSelect={handleItemSelect}
              onModelApplied={(res) => {
                if (res?.appearanceData) {
                  setAppearanceData(res.appearanceData);
                  setSelectedItem({ model: res.appearanceData.model });
                }
                if (res?.appearanceSettings) {
                  setAppearanceSettings(res.appearanceSettings);
                }
              }}
              isFree={isFree}
              prices={prices}
              images={images}
            />
          ) : (
             <Sliders 
               navPath={navPath}
               setNavPath={handleSetNavPath}
               activeCategory={activeCategory}
               appearanceData={appearanceData}
               setAppearanceData={setAppearanceData}
               setTotalCost={setTotalCost}
               isFree={isFree}
               prices={prices}
             />
          )}
        </main>
      </div>



      {/* CustomizationPanel — fixed right-center, handles both clothing textures & Hair/Beard/Overlay Color Picker */}
      {(() => {
        const isHairCat = activeCategory === 'HAIR' || activeCategory === 'STYLES' || activeCategory === 'HAIRSTYLE';
        const isOverlayColorCat = ['FACIAL HAIR', 'beard', 'EYEBROWS', 'eyebrows', 'MAKEUP', 'makeUp', 'BLUSH', 'blush', 'LIPSTICK', 'lipstick', 'CHEST HAIR', 'chestHair'].includes(activeCategory);
        const isColorCat = isHairCat || isOverlayColorCat;
        const isComponentOrPropCat = (navPath[0] === 'APPAREL' ? navPath.length > 2 : navPath.length > 1) && currentActiveItem && viewMode === 'grid' && (itemType === 'component' || itemType === 'prop');
        
        if (!isColorCat && !isComponentOrPropCat) return null;

        return (
          <div className="fixed right-12 top-1/2 -translate-y-1/2 z-40 pointer-events-auto select-none">
            <CustomizationPanel
              activeCategory={activeCategory}
              activeItem={currentActiveItem}
              appearanceData={appearanceData}
              setAppearanceData={setAppearanceData}
              setTotalCost={setTotalCost}
              gender={gender}
              totalCost={totalCost}
              onTextureSelect={handleTextureSelect}
              isFree={isFree}
              prices={prices}
              images={images}
            />
          </div>
        );
      })()}

      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none">
        {renderKeybinds()}
      </div>

      <div className="fixed bottom-20 right-12 z-50 flex flex-col items-end gap-4 pointer-events-auto select-none">
        <div className="w-[380px] flex flex-col shadow-2xl">
          <div className="bg-white text-black px-4 py-2.5 flex justify-between items-center">
            <span className="font-oswald font-bold text-[18px] tracking-wider uppercase">TOTAL COST</span>
            <div className="flex items-center gap-1 font-oswald font-bold text-[20px]">
              <span>{isFree ? 'FREE' : `$${totalCost.toLocaleString()}`}</span>
              {!isFree && <span className="text-xs opacity-80 mt-1 uppercase">+ TAX</span>}
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleResetAppearance}
              title="Reset to Original Appearance"
              className="w-1/3 py-2.5 bg-red-600/90 hover:bg-red-600 text-white font-oswald font-bold text-[15px] tracking-wider transition-colors uppercase cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RotateCcwIcon />
              RESET
            </button>
            <button
              onClick={handleConfirm}
              className="w-2/3 py-2.5 bg-black hover:bg-zinc-900 text-white font-oswald font-bold text-[18px] tracking-widest transition-colors uppercase cursor-pointer text-center"
            >
              CONFIRM
            </button>
          </div>
        </div>
      </div>

      {/* Payment Confirmation Side Panel */}
      {showPaymentModal && (
        <div className="fixed right-12 bottom-48 z-[100] pointer-events-auto select-none">
          <div className="w-[380px] bg-[#111317]/95 border border-white/10 p-5 flex flex-col gap-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex flex-col gap-1 border-b border-white/10 pb-3">
              <div className="flex justify-between items-center">
                <span className="font-bebas italic text-2xl tracking-wider text-white">PAYMENT METHOD</span>
                <button 
                  onClick={() => setShowPaymentModal(false)}
                  className="w-7 h-7 flex items-center justify-center text-white/50 hover:text-white bg-white/5 hover:bg-white/10 font-bold transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <span className="font-oswald text-xs text-zinc-400 uppercase tracking-wider">
                Select your payment method
              </span>
            </div>

            {/* Total Cost Display */}
            <div className="bg-[#181a20] p-3.5 flex justify-between items-center border border-white/5">
              <span className="font-oswald font-bold text-sm text-zinc-300 uppercase tracking-wider">TOTAL AMOUNT</span>
              <div className="flex items-center gap-1 font-oswald font-bold text-2xl text-white">
                <span>${totalCost.toLocaleString()}</span>
                <span className="text-xs text-white/60 uppercase">+ TAX</span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="flex flex-col gap-2.5">
              {/* Cash Option */}
              <button
                onClick={() => handleConfirmPayment('cash')}
                disabled={money.cash < totalCost}
                className={`
                  w-full p-3.5 flex items-center justify-between border transition-all cursor-pointer text-left
                  ${money.cash >= totalCost 
                    ? 'bg-[#181a20] hover:bg-[#20232b] border-white/10 hover:border-white' 
                    : 'bg-[#181a20]/40 border-white/5 opacity-50 cursor-not-allowed'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-oswald font-bold text-xl">
                    $
                  </div>
                  <div className="flex flex-col">
                    <span className="font-oswald font-bold text-base text-white uppercase tracking-wider">CASH</span>
                    <span className="font-oswald text-xs text-zinc-400">
                      Available: ${money.cash.toLocaleString()}
                    </span>
                  </div>
                </div>
                {money.cash < totalCost && (
                  <span className="text-xs font-oswald font-bold text-red-400 uppercase">INSUFFICIENT</span>
                )}
              </button>

              {/* Card / Bank Option */}
              <button
                onClick={() => handleConfirmPayment('card')}
                disabled={money.bank < totalCost}
                className={`
                  w-full p-3.5 flex items-center justify-between border transition-all cursor-pointer text-left
                  ${money.bank >= totalCost 
                    ? 'bg-[#181a20] hover:bg-[#20232b] border-white/10 hover:border-[#00c8ff]' 
                    : 'bg-[#181a20]/40 border-white/5 opacity-50 cursor-not-allowed'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#00c8ff] text-black flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12 2L2 7H22L12 2ZM2 9V20H4V9H2ZM6 9V20H8V9H6ZM10 9V20H12V9H10ZM14 9V20H16V9H14ZM18 9V20H20V9H18ZM2 22H22V24H2V22Z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-oswald font-bold text-base text-white uppercase tracking-wider">CARD / BANK</span>
                    <span className="font-oswald text-xs text-zinc-400">
                      Available: ${money.bank.toLocaleString()}
                    </span>
                  </div>
                </div>
                {money.bank < totalCost && (
                  <span className="text-xs font-oswald font-bold text-red-400 uppercase">INSUFFICIENT</span>
                )}
              </button>
            </div>

            {/* Cancel Button */}
            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-oswald font-bold text-sm tracking-widest uppercase transition-colors cursor-pointer text-center"
            >
              CANCEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}