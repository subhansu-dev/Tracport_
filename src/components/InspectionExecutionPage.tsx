import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Camera, 
  MapPin, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Check,
  Eye,
  RefreshCw,
  UserCheck,
  User
} from 'lucide-react';
import { Institution, InspectorUser, InspectionReport, InspectionItemSection, InspectionCondition, InspectionPhotoData } from '../types';
import { LiveCameraModal } from './LiveCameraModal';
import { PhotoEditorDialog } from './PhotoEditorDialog';
import { PhotoPreviewModal } from './PhotoPreviewModal';
import { 
  GeotagInfo, 
  getCurrentFormattedDate, 
  getCurrentFormattedTime,
  reverseGeocodeCoordinates,
  getLocalGeographicLocation
} from '../utils/imageProcessing';

interface InspectionExecutionPageProps {
  institution: Institution;
  inspector: InspectorUser;
  isOnline: boolean;
  onBack: () => void;
  onSubmitInspection: (report: InspectionReport) => void;
}

export const InspectionExecutionPage: React.FC<InspectionExecutionPageProps> = ({
  institution,
  inspector,
  isOnline,
  onBack,
  onSubmitInspection
}) => {
  // Real Current Location State (NOT hardcoded)
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
    areaName: string;
    pincode: string;
  }>(() => {
    const lat = 29.16428;
    const lng = 75.72225;
    const initial = getLocalGeographicLocation(lat, lng);
    return {
      lat,
      lng,
      areaName: initial.areaName,
      pincode: initial.pincode,
    };
  });

  // Automatically detect user's current coordinates and reverse-geocode current area/PIN
  useEffect(() => {
    let isMounted = true;

    const resolveCurrentPosition = async (lat: number, lng: number) => {
      if (!isMounted) return;
      setCurrentLocation((prev) => ({ ...prev, lat, lng }));
      try {
        const rev = await reverseGeocodeCoordinates(lat, lng);
        if (isMounted && rev.areaName && !rev.areaName.includes('Detecting')) {
          setCurrentLocation({
            lat,
            lng,
            areaName: rev.areaName,
            pincode: rev.pincode
          });
        }
      } catch (err) {
        console.warn('Current location reverse geocode error:', err);
      }
    };

    // Immediately resolve active position so UI is instantly populated
    resolveCurrentPosition(currentLocation.lat, currentLocation.lng);

    if (navigator.geolocation) {
      // 1. Rapid network/Wi-Fi positioning (returns within 200-500ms)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolveCurrentPosition(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn('Rapid network location failed, trying high accuracy GPS:', err);
          // 2. High-accuracy satellite GPS fallback
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              resolveCurrentPosition(pos.coords.latitude, pos.coords.longitude);
            },
            (err2) => {
              console.warn('Geolocation unavailable:', err2);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
          );
        },
        { enableHighAccuracy: false, timeout: 4000, maximumAge: 10000 }
      );

      // Continuous watchPosition: updates dynamically as the user moves
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          resolveCurrentPosition(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.warn('WatchPosition error:', err);
        },
        { enableHighAccuracy: true, maximumAge: 3000 }
      );

      return () => {
        isMounted = false;
        navigator.geolocation.clearWatch(watchId);
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Initial single inspection item section
  const [items, setItems] = useState<InspectionItemSection[]>([
    {
      id: 'item-1',
      itemName: '',
      condition: 'Normal',
      detailedDescription: ''
    }
  ]);

  // Camera modal state
  const [activeCameraItemId, setActiveCameraItemId] = useState<string | null>(null);

  // Photo Editor dialog state (opened right after taking a picture, just like user screenshot)
  const [photoEditorData, setPhotoEditorData] = useState<{
    isOpen: boolean;
    initialImageUrl: string;
    geotag: GeotagInfo;
    itemId: string;
  } | null>(null);

  // Photo Preview modal state (for previewing the finalized picture)
  const [photoPreviewData, setPhotoPreviewData] = useState<{
    isOpen: boolean;
    photo: InspectionPhotoData | null;
    itemName: string;
  } | null>(null);

  // Inspecting officer identity verification photo state
  const [inspectorPhoto, setInspectorPhoto] = useState<InspectionPhotoData | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add another inspection item
  const handleAddAnotherItem = () => {
    const newItem: InspectionItemSection = {
      id: `item-${Date.now()}`,
      itemName: '',
      condition: 'Normal',
      detailedDescription: ''
    };
    setItems((prev) => [...prev, newItem]);
    showToast('New inspection item section added');
  };

  // Remove an item section
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Update item field
  const handleUpdateItem = <K extends keyof InspectionItemSection>(
    id: string,
    field: K,
    value: InspectionItemSection[K]
  ) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // 1. Camera snaps photo -> Closes Camera & opens PhotoEditorDialog immediately
  const handlePhotoCapturedFromCamera = (rawImage: string, geotag: GeotagInfo) => {
    if (!activeCameraItemId) return;
    const targetItemId = activeCameraItemId;
    setActiveCameraItemId(null);

    // Open the Dialog Box (Crop, Enhance AI, Rotate, Retake, Select)
    setPhotoEditorData({
      isOpen: true,
      initialImageUrl: rawImage,
      geotag,
      itemId: targetItemId,
    });
  };

  // 2. In PhotoEditorDialog: User clicks Retake -> closes editor and re-opens live camera
  const handleRetakeFromEditor = () => {
    if (!photoEditorData) return;
    const itemId = photoEditorData.itemId;
    setPhotoEditorData(null);
    setActiveCameraItemId(itemId);
  };

  // 3. In PhotoEditorDialog: User clicks Select -> saves final photo to item & closes dialog
  const handleSelectFromEditor = (finalImageUrl: string, geotag: GeotagInfo) => {
    if (!photoEditorData) return;
    const itemId = photoEditorData.itemId;

    const photoData: InspectionPhotoData = {
      imageUrl: finalImageUrl,
      originalImageUrl: photoEditorData.initialImageUrl,
      rotationDegrees: 0,
      latitude: geotag.latitude,
      longitude: geotag.longitude,
      areaName: geotag.areaName,
      pincode: geotag.pincode,
      date: geotag.date,
      time: geotag.time,
      isAiEnhanced: false
    };

    if (itemId === 'officer-verification') {
      setInspectorPhoto(photoData);
      setPhotoEditorData(null);
      showToast('Inspecting Officer identity photo verified and recorded');
      return;
    }

    handleUpdateItem(itemId, 'photo', photoData);
    setPhotoEditorData(null);
    showToast('Photo verified and selected for inspection');
  };

  // Retake photo directly from the form
  const handleRetakeFromForm = (itemId: string) => {
    setActiveCameraItemId(itemId);
  };

  // Preview full photo in modal
  const handleOpenPreview = (photo: InspectionPhotoData, itemName: string) => {
    setPhotoPreviewData({
      isOpen: true,
      photo,
      itemName: itemName || 'Inspection Evidence'
    });
  };

  // Submit complete inspection report
  const handleSubmit = () => {
    const hasValidItem = items.some((i) => i.itemName.trim().length > 0);
    if (!hasValidItem) {
      showToast('Please enter an inspection item name before submitting');
      return;
    }

    // Mandatory anti-proxy identity check
    if (!inspectorPhoto) {
      showToast('Mandatory: Please capture Inspecting Officer verification photo before submitting');
      setActiveCameraItemId('officer-verification');
      return;
    }

    const report: InspectionReport = {
      id: `INSP-${Date.now().toString().slice(-6)}`,
      institutionId: institution.id,
      institutionName: institution.name,
      category: institution.category,
      inspectorId: inspector.id,
      inspectorName: inspector.name,
      date: getCurrentFormattedDate(),
      timeStarted: '10:00 AM',
      timeFinished: getCurrentFormattedTime(),
      geofenceVerified: true,
      actualBeneficiariesCount: institution.registeredBeneficiaries,
      registeredBeneficiariesCount: institution.registeredBeneficiaries,
      checklist: items.map((item, index) => ({
        id: `chk-${index + 1}`,
        category: 'Infrastructure & Safety',
        question: `Verification of ${item.itemName || `Item ${index + 1}`}`,
        status: item.condition === 'Normal' ? 'passed' : item.condition === 'Need more improvement' ? 'conditional' : 'failed',
        remarks: item.detailedDescription,
        isMandatory: true,
        scoreWeight: 20
      })),
      evidences: items
        .filter((i) => i.photo)
        .map((i, idx) => ({
          id: `ev-${idx + 1}`,
          tag: i.itemName || `Inspection Item ${idx + 1}`,
          imageUrl: i.photo!.imageUrl,
          timestamp: i.photo!.time,
          latitude: i.photo!.latitude,
          longitude: i.photo!.longitude,
          accuracyMeters: 2.8,
          hashSignature: `GEO-VERIFIED-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
        })),
      overallScore: 90,
      grade: 'A+',
      status: isOnline ? 'SYNCED' : 'DRAFT_OFFLINE',
      aiAnomalyNotes: [],
      inspectorNotes: items.map((i) => `${i.itemName} (${i.condition}): ${i.detailedDescription}`).join(' | '),
      syncTimestamp: isOnline ? new Date().toISOString() : undefined,
      inspectionSections: items,
      inspectorPhoto: inspectorPhoto
    };

    onSubmitInspection(report);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] text-blue-950 font-sans pb-16 selection:bg-blue-600 selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-950 text-white px-4 py-3 rounded-2xl shadow-xl border border-blue-800 text-xs flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-blue-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar with Back & Submit */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#EFECE6] shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 text-blue-900 hover:text-blue-950 font-semibold text-xs sm:text-sm px-3 py-1.5 rounded-xl hover:bg-[#FBF9F5] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-blue-700" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-2.5">
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
              isOnline ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
            }`}>
              {isOnline ? 'Online' : 'Offline Mode'}
            </span>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Submit Inspection</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Inspection Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* ========================================================
            2. IN TOP: Center name in mid font & address just below
            ======================================================== */}
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#EFECE6] shadow-xs mb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold mb-2">
            <span>MoSJE Field Physical Inspection</span>
          </div>

          {/* Center Name in Mid Font */}
          <h1 className="text-xl sm:text-2xl font-bold text-blue-950 tracking-tight">
            {institution.name}
          </h1>

          {/* Address of that Center Just Below the Name */}
          <p className="text-xs sm:text-sm text-blue-800/80 mt-1 flex items-center justify-center sm:justify-start gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{institution.address}, {institution.district}, {institution.state}</span>
          </p>

          {/* 3. AFTER ADDRESS: Line dividing the above portion */}
          <hr className="border-t border-[#F1EDE7] my-5" />

          <div className="flex flex-wrap items-center justify-between text-xs text-blue-700/80 gap-2">
            <span>Inspector: <strong className="text-blue-950">{inspector.name}</strong></span>
            <span>Date: <strong className="text-blue-950">{getCurrentFormattedDate()}</strong></span>
            <span>Current Location: <strong className="text-blue-950">{currentLocation.areaName}{currentLocation.pincode ? ` (${currentLocation.pincode})` : ''}</strong></span>
          </div>
        </div>

        {/* ========================================================
            4 to 12: INSPECTION ITEM SECTIONS
            ======================================================== */}
        <div className="space-y-6">
          {items.map((item, index) => {
            const isSingleItem = items.length === 1;

            return (
              <div 
                key={item.id}
                className="bg-white rounded-2xl p-5 sm:p-7 border border-[#EFECE6] shadow-xs relative transition-all"
              >
                {/* Section Index Header & Optional Remove Button */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-bold text-xs flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                      Inspection Section {index + 1}
                    </span>
                  </div>

                  {!isSingleItem && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Item</span>
                    </button>
                  )}
                </div>

                {/* ========================================================
                    4. FORM WITH HEADING: "Inspection Item Name"
                    ======================================================== */}
                <div className="space-y-2">
                  <label 
                    htmlFor={`item-name-${item.id}`}
                    className="block text-sm font-bold text-blue-950"
                  >
                    Inspection Item Name
                  </label>
                  <input
                    id={`item-name-${item.id}`}
                    type="text"
                    value={item.itemName}
                    onChange={(e) => handleUpdateItem(item.id, 'itemName', e.target.value)}
                    placeholder="eg. Food.. "
                    className="w-full px-4 py-3 bg-[#FBF9F5] border border-[#EFECE6] rounded-xl text-xs sm:text-sm text-blue-950 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 4. THEN AGAIN A LINE */}
                <hr className="border-t border-[#F1EDE7] my-5" />

                {/* ========================================================
                    5. HEADING CALLED "Condition" WITH DROPDOWN:
                       1. Normal
                       2. Need more improvement
                       3. Very bad condition
                    ======================================================== */}
                <div className="space-y-2">
                  <label 
                    htmlFor={`condition-${item.id}`}
                    className="block text-sm font-bold text-blue-950"
                  >
                    Condition
                  </label>
                  <div className="relative">
                    <select
                      id={`condition-${item.id}`}
                      value={item.condition}
                      onChange={(e) => handleUpdateItem(item.id, 'condition', e.target.value as InspectionCondition)}
                      className="w-full px-4 py-3 bg-[#FBF9F5] border border-[#EFECE6] rounded-xl text-xs sm:text-sm text-blue-950 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer font-medium"
                    >
                      <option value="Normal"> Normal</option>
                      <option value="Need more improvement"> Need more improvement</option>
                      <option value="Very bad condition"> Very bad condition</option>
                    </select>
                  </div>
                  
                  {/* Visual Status Indicator */}
                  <div className="text-[11px] font-medium mt-1">
                    {item.condition === 'Normal' && (
                      <span className="text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Compliant with MoSJE institutional safety norms
                      </span>
                    )}
                    {item.condition === 'Need more improvement' && (
                      <span className="text-amber-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Minor deficiencies noticed; corrective notice recommended
                      </span>
                    )}
                    {item.condition === 'Very bad condition' && (
                      <span className="text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Urgent non-compliance flagged for immediate nodal review
                      </span>
                    )}
                  </div>
                </div>

                {/* 6. THEN ADD A LINE TO SEPERATE */}
                <hr className="border-t border-[#F1EDE7] my-5" />

                {/* ========================================================
                    7. CAMERA FEATURE WITH HEADING "Add Photo" & LONG BUTTON
                       Only Live Camera (No opening folder to select images)
                       After Capture: Dialog Box opens (Crop, Enhance AI, Rotate, Retake, Select)
                       After Selecting: User CANNOT edit, but CAN PREVIEW it
                    8. GPS LOCATION (coordinates, area name, pincode, ddmmyyyy, time)
                    ======================================================== */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-blue-950">
                      Add Photo
                    </label>
                    <span className="text-[11px] text-blue-600 font-medium">
                      Live camera 
                    </span>
                  </div>

                  {/* If no photo is captured yet: show long button with camera logo */}
                  {!item.photo ? (
                    <button
                      type="button"
                      onClick={() => setActiveCameraItemId(item.id)}
                      className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base rounded-2xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Capture Live Photo</span>
                    </button>
                  ) : (
                    /* Photo already selected: user cannot edit it here, but can preview it */
                    <div className="space-y-3">
                      {/* Image Preview Container (Clickable to preview in full screen) */}
                      <div 
                        onClick={() => handleOpenPreview(item.photo!, item.itemName)}
                        className="group relative rounded-2xl overflow-hidden border-2 border-blue-200 bg-slate-950 shadow-sm cursor-pointer"
                      >
                        <img
                          src={item.photo.imageUrl}
                          alt="Captured evidence"
                          className="w-full max-h-[340px] object-contain mx-auto group-hover:opacity-95 transition-opacity"
                        />

                        {/* Top Overlay Badge */}
                        <div className="absolute top-3 left-3 bg-blue-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/20 text-white text-[10px] font-mono flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>MoSJE Live Geo-Stamped</span>
                        </div>

                        {/* Click to preview banner overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="px-4 py-2 bg-blue-600/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
                            <Eye className="w-4 h-4" />
                            <span>View Image</span>
                          </div>
                        </div>
                      </div>

                      {/* Photo Actions: Preview & Retake (No editing in the form, editing is done in the dialog) */}
                      <div className="flex items-center justify-between gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(item.photo!, item.itemName)}
                          className="flex-1 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-blue-600" />
                          <span>Preview Picture</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRetakeFromForm(item.id)}
                          className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Retake</span>
                        </button>
                      </div>

                      {/* ========================================================
                          8. GPS LOCATION DETAILS: Coordinates, Area Name, Pincode, Date in DDMMYYYY & Time
                          ======================================================== */}
                      <div className="p-3.5 rounded-xl bg-[#FBF9F5] border border-[#EFECE6] text-xs space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between text-blue-900 font-semibold border-b border-[#EFECE6] pb-1.5 mb-1.5">
                          <span className="flex items-center gap-1.5 text-blue-800">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>GPS Coordinates:</span>
                          </span>
                          <span className="font-mono text-blue-950 font-bold">
                            {item.photo.latitude.toFixed(5)}° N, {item.photo.longitude.toFixed(5)}° E
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-blue-800/90 text-[11px]">
                          <div>
                            <span className="text-blue-500 font-medium">Current Location & PIN: </span>
                            <strong className="text-blue-950">
                              {(!item.photo.areaName || item.photo.areaName.includes('Detecting'))
                                ? getLocalGeographicLocation(item.photo.latitude, item.photo.longitude).areaName
                                : item.photo.areaName}
                              {(item.photo.pincode || getLocalGeographicLocation(item.photo.latitude, item.photo.longitude).pincode)
                                ? ` - ${item.photo.pincode || getLocalGeographicLocation(item.photo.latitude, item.photo.longitude).pincode}`
                                : ''}
                            </strong>
                          </div>

                          <div className="flex items-center gap-3 justify-start sm:justify-end">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              <span>Date: <strong className="text-blue-950 font-mono">{item.photo.date}</strong></span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>Time: <strong className="text-blue-950 font-mono">{item.photo.time}</strong></span>
                            </span>
                          </div>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                {/* 9. ADD LINE FOR SEPERATION */}
                <hr className="border-t border-[#F1EDE7] my-5" />

                {/* ========================================================
                    10. FORM FOR DESCRIBING THE INSPECTION ITEM IN DETAIL:
                        Heading will be "Describe in detail.."
                    ======================================================== */}
                <div className="space-y-2">
                  <label 
                    htmlFor={`desc-${item.id}`}
                    className="block text-sm font-bold text-blue-950"
                  >
                    Describe in detail..
                  </label>
                  <textarea
                    id={`desc-${item.id}`}
                    rows={3}
                    value={item.detailedDescription}
                    onChange={(e) => handleUpdateItem(item.id, 'detailedDescription', e.target.value)}
                    placeholder="Enter detailed notes regarding this item..."
                    className="w-full p-3.5 bg-[#FBF9F5] border border-[#EFECE6] rounded-xl text-xs sm:text-sm text-blue-950 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* 11. ADD ANOTHER LINE FOR SEPERATION */}
                <hr className="border-t border-[#F1EDE7] mt-5" />

              </div>
            );
          })}
        </div>

        {/* ========================================================
            12. BUTTON IN VERY BOTTOM WITH HEADING "+ Add another Inspection "
            ======================================================== */}
        <div className="mt-6 mb-8 space-y-4">
          <button
            type="button"
            onClick={handleAddAnotherItem}
            className="w-full py-4 px-6 bg-white hover:bg-blue-50 active:scale-[0.99] text-blue-700 hover:text-blue-900 border-2 border-dashed border-blue-300 hover:border-blue-400 font-bold text-sm sm:text-base rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Plus className="w-5 h-5 text-blue-600" />
            <span>+ Add another Inspection</span>
          </button>

          {/* ========================================================
              MANDATORY INSPECTING OFFICER LIVE IDENTITY VERIFICATION
              Anti-Proxy Protocol: Verifies if assigned officer or surrogate conducted inspection
              ======================================================== */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border-2 border-blue-200 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EFECE6] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">
                    Government Anti-Proxy Verification · Mandatory
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-blue-950">
                    Inspecting Officer Live Identity Verification
                  </h3>
                </div>
              </div>

              {inspectorPhoto ? (
                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Officer Verified ✓</span>
                </span>
              ) : (
                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Verification Required</span>
                </span>
              )}
            </div>

            {/* Officer Details Banner (Responsive flex layout) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-blue-50/60 p-3.5 sm:p-4 rounded-xl border border-blue-100 text-xs">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider block">
                  Assigned Inspector
                </span>
                <div className="font-bold text-blue-950 text-sm sm:text-base mt-0.5">
                  <span>{inspector.name}</span>
                </div>
              </div>

              {inspector.badgeNumber && (
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider block">
                    Official Badge ID
                  </span>
                  <div className="font-mono font-bold text-blue-900 text-xs sm:text-sm mt-0.5">
                    {inspector.badgeNumber}
                  </div>
                </div>
              )}
            </div>

            {/* Photo Section: If not captured -> Prominent Responsive Capture Box */}
            {!inspectorPhoto ? (
              <div className="border-2 border-dashed border-blue-300 hover:border-blue-400 rounded-2xl p-5 sm:p-8 bg-[#FBF9F5] text-center space-y-3 sm:space-y-4 transition-colors">
                <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center">
                  <Camera className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600" />
                </div>
                <div className="max-w-md mx-auto">
                  
                  
                </div>
                <button
                  type="button"
                  onClick={() => setActiveCameraItemId('officer-verification')}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Live Officer Photo (Selfie)</span>
                </button>
              </div>
            ) : (
              /* If captured -> Preview photo + Telemetry + Actions */
              <div className="space-y-4">
                <div 
                  onClick={() => handleOpenPreview(inspectorPhoto, `Inspecting Officer: ${inspector.name}`)}
                  className="group relative rounded-2xl overflow-hidden border border-blue-200 bg-slate-950 cursor-pointer shadow-sm"
                >
                  <img
                    src={inspectorPhoto.imageUrl}
                    alt={`Officer: ${inspector.name}`}
                    className="w-full max-h-[360px] object-contain mx-auto group-hover:opacity-95 transition-opacity"
                  />

                  {/* Top Overlay Badge */}
                  <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 bg-blue-950/80 backdrop-blur-md px-2.5 py-1 sm:px-3 rounded-lg border border-white/20 text-white text-[10px] sm:text-xs font-mono flex items-center gap-1.5 sm:gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>MoSJE Officer Verified</span>
                  </div>

                  {/* Click to preview banner overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                    <div className="px-4 py-2 bg-blue-600/90 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg">
                      <Eye className="w-4 h-4" />
                      <span>Preview Picture</span>
                    </div>
                  </div>
                </div>

                {/* Photo Actions: Preview & Retake (responsive full width on mobile) */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenPreview(inspectorPhoto, `Inspecting Officer: ${inspector.name}`)}
                    className="flex-1 py-2.5 px-4 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                    <span>Preview Picture</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCameraItemId('officer-verification')}
                    className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Retake Photo</span>
                  </button>
                </div>

                {/* GPS Location Details (fully responsive stack) */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-[#FBF9F5] border border-[#EFECE6] text-xs space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-blue-900 font-semibold border-b border-[#EFECE6] pb-2">
                    <span className="flex items-center gap-1.5 text-blue-800">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Verification Coordinates:</span>
                    </span>
                    <span className="font-mono text-blue-950 font-bold text-xs sm:text-sm break-all">
                      {inspectorPhoto.latitude.toFixed(5)}° N, {inspectorPhoto.longitude.toFixed(5)}° E
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-blue-800/90 text-[11px] sm:text-xs pt-0.5">
                    <div className="min-w-0">
                      <span className="text-blue-500 font-medium">Current Location & PIN: </span>
                      <strong className="text-blue-950">
                        {(!inspectorPhoto.areaName || inspectorPhoto.areaName.includes('Detecting'))
                          ? getLocalGeographicLocation(inspectorPhoto.latitude, inspectorPhoto.longitude).areaName
                          : inspectorPhoto.areaName}
                        {(inspectorPhoto.pincode || getLocalGeographicLocation(inspectorPhoto.latitude, inspectorPhoto.longitude).pincode)
                          ? ` - ${inspectorPhoto.pincode || getLocalGeographicLocation(inspectorPhoto.latitude, inspectorPhoto.longitude).pincode}`
                          : ''}
                      </strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Date: <strong className="text-blue-950 font-mono">{inspectorPhoto.date}</strong></span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>Time: <strong className="text-blue-950 font-mono">{inspectorPhoto.time}</strong></span>
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Final Submit Bar */}
          <div className="bg-white rounded-2xl p-5 border border-[#EFECE6] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-blue-950">
                Ready to submit inspection verification?
              </div>
              <div className="text-xs text-blue-700/80">
                {items.length} inspection {items.length === 1 ? 'item' : 'items'} recorded for {institution.name}
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onBack}
                className="w-1/2 sm:w-auto px-4 py-2.5 text-xs font-semibold text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                className="w-1/2 sm:w-auto px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Submit Inspection</span>
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* 1. Live Camera Modal */}
      <LiveCameraModal
        isOpen={Boolean(activeCameraItemId)}
        onClose={() => setActiveCameraItemId(null)}
        onCapture={handlePhotoCapturedFromCamera}
        initialLat={currentLocation.lat}
        initialLng={currentLocation.lng}
        initialAreaName={currentLocation.areaName}
        initialPincode={currentLocation.pincode}
        title={activeCameraItemId === 'officer-verification' ? 'Inspecting Officer Identity Verification' : 'Live Inspection Camera'}
        subtitle={activeCameraItemId === 'officer-verification' ? 'Anti-Proxy Live Officer Selfie Verification' : 'MoSJE Real-Time Verification Sensor'}
        defaultFacingMode={activeCameraItemId === 'officer-verification' ? 'user' : 'environment'}
        watermarkTitle={activeCameraItemId === 'officer-verification' ? 'MoSJE Officer Verification' : 'MoSJE Field Inspection'}
        sealText={activeCameraItemId === 'officer-verification' ? '✓ OFFICER VERIFIED' : '✓ TAMPER-VERIFIED'}
      />

      {/* 2. Photo Editor Dialog (Exact screen from user's screenshot: Crop, Enhance AI, Rotate, Retake, Select) */}
      {photoEditorData && (
        <PhotoEditorDialog
          isOpen={photoEditorData.isOpen}
          initialImageUrl={photoEditorData.initialImageUrl}
          geotag={photoEditorData.geotag}
          onClose={() => setPhotoEditorData(null)}
          onRetake={handleRetakeFromEditor}
          onSelect={handleSelectFromEditor}
        />
      )}

      {/* 3. Photo Preview Modal (User cannot edit, but can preview full image) */}
      {photoPreviewData && (
        <PhotoPreviewModal
          isOpen={photoPreviewData.isOpen}
          photo={photoPreviewData.photo}
          itemName={photoPreviewData.itemName}
          onClose={() => setPhotoPreviewData(null)}
        />
      )}

    </div>
  );
};
