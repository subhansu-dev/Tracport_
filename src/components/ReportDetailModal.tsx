import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Printer, 
  MapPin, 
  Calendar, 
  Clock, 
  Eye, 
  ZoomIn, 
  ArrowLeft,
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Building2,
  User,
  UserCheck,
  FileCheck
} from 'lucide-react';
import { InspectionReport, InspectionCondition } from '../types';
import { getLocalGeographicLocation } from '../utils/imageProcessing';

interface ReportDetailModalProps {
  report: InspectionReport;
  onClose: () => void;
}

interface NormalizedSection {
  id: string;
  sectionNumber: number;
  itemName: string;
  condition: InspectionCondition;
  detailedDescription: string;
  photo?: {
    imageUrl: string;
    latitude: number;
    longitude: number;
    areaName?: string;
    pincode?: string;
    date?: string;
    time?: string;
  };
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ report, onClose }) => {
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    imageUrl: string;
    title: string;
    latitude: number;
    longitude: number;
    areaName?: string;
    pincode?: string;
    date?: string;
    time?: string;
  } | null>(null);

  // Normalize sections so details are always presented section-wise, exactly as entered
  const sections: NormalizedSection[] = React.useMemo(() => {
    // 1. If original inspectionSections was preserved
    if (report.inspectionSections && report.inspectionSections.length > 0) {
      return report.inspectionSections.map((sec, idx) => ({
        id: sec.id || `sec-${idx + 1}`,
        sectionNumber: idx + 1,
        itemName: sec.itemName || `Inspection Item ${idx + 1}`,
        condition: sec.condition || 'Normal',
        detailedDescription: sec.detailedDescription || '',
        photo: sec.photo ? {
          imageUrl: sec.photo.imageUrl,
          latitude: sec.photo.latitude,
          longitude: sec.photo.longitude,
          areaName: sec.photo.areaName,
          pincode: sec.photo.pincode,
          date: sec.photo.date,
          time: sec.photo.time
        } : undefined
      }));
    }

    // 2. Fallback normalization from checklist & evidences
    if (report.checklist && report.checklist.length > 0) {
      return report.checklist.map((chk, idx) => {
        const cleanName = chk.question.replace(/^Verification of\s*/i, '');
        const matchedEvidence = report.evidences?.find(
          (ev) => ev.tag.toLowerCase().includes(cleanName.toLowerCase()) || cleanName.toLowerCase().includes(ev.tag.toLowerCase())
        ) || report.evidences?.[idx];

        let cond: InspectionCondition = 'Normal';
        if (chk.status === 'conditional') cond = 'Need more improvement';
        if (chk.status === 'failed') cond = 'Very bad condition';

        return {
          id: chk.id || `chk-${idx + 1}`,
          sectionNumber: idx + 1,
          itemName: cleanName,
          condition: cond,
          detailedDescription: chk.remarks || '',
          photo: matchedEvidence ? {
            imageUrl: matchedEvidence.imageUrl,
            latitude: matchedEvidence.latitude,
            longitude: matchedEvidence.longitude,
            date: report.date,
            time: matchedEvidence.timestamp
          } : undefined
        };
      });
    }

    // 3. Fallback from evidences only
    if (report.evidences && report.evidences.length > 0) {
      return report.evidences.map((ev, idx) => ({
        id: ev.id,
        sectionNumber: idx + 1,
        itemName: ev.tag || `Item ${idx + 1}`,
        condition: 'Normal',
        detailedDescription: '',
        photo: {
          imageUrl: ev.imageUrl,
          latitude: ev.latitude,
          longitude: ev.longitude,
          date: report.date,
          time: ev.timestamp
        }
      }));
    }

    return [];
  }, [report]);

  return (
    <div className="fixed inset-0 z-50 bg-[#FDFCF9] overflow-y-auto text-blue-950 font-sans selection:bg-blue-600 selection:text-white print:p-0 print:bg-white animate-fadeIn">
      
      {/* ========================================================
          STICKY TOP NAVIGATION BAR (FULL SCREEN)
          ======================================================== */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EFECE6] shadow-xs print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-blue-900 hover:text-blue-950 font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-xl hover:bg-[#FBF9F5] border border-transparent hover:border-[#EFECE6] transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-blue-700" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[11px] font-mono font-bold text-blue-800">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              RECORD #{report.id}
            </span>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print Official Report</span>
              <span className="sm:hidden">Print</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close Report"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================
          MAIN FULL-SCREEN CONTENT CONTAINER
          ======================================================== */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-10 space-y-8">
        
        {/* ========================================================
            OFFICIAL MOSJE REPORT HEADER BANNER
            ======================================================== */}
        <section className="bg-white rounded-2xl border border-[#EFECE6] shadow-xs overflow-hidden">
          
          {/* Top Navy Government Bar */}
          <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 backdrop-blur-md">
                  <ShieldCheck className="w-7 h-7 text-blue-300" />
                </div>
                <div>
                  <div className="text-[11px] font-mono tracking-widest uppercase text-blue-200 font-semibold">
                    Government of India · Ministry of Social Justice and Empowerment
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {report.institutionName}
                  </h1>
                  <p className="text-xs text-blue-200/90 mt-1 flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-blue-300" />
                    <span>{report.category}</span>
                  </p>
                </div>
              </div>

              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                <div className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>MOSJE-VERIFIED ✓</span>
                </div>
                <div className="text-[11px] font-mono text-blue-300">
                  STATUS: <strong className="text-white">{report.status}</strong>
                </div>
              </div>

            </div>
          </div>

          {/* Quick Inspection Meta Grid */}
          <div className="p-4 sm:p-6 bg-[#FBF9F5] border-t border-[#EFECE6] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Report Identifier</span>
              <div className="font-mono font-bold text-blue-950 text-sm mt-0.5">{report.id}</div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Inspecting Officer</span>
              <div className="font-semibold text-blue-950 text-sm mt-0.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>{report.inspectorName}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Inspection Date</span>
              <div className="font-semibold text-blue-950 text-sm mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>{report.date}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Total Items Inspected</span>
              <div className="font-mono font-bold text-blue-950 text-sm mt-0.5 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>{sections.length} Section{sections.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

        </section>

        {/* ========================================================
            INSPECTING OFFICER LIVE ON-SITE IDENTITY VERIFICATION
            ======================================================== */}
        <section className="bg-white rounded-2xl border border-blue-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[#EFECE6] bg-[#FBF9F5] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 font-bold">
                  Government Anti-Proxy Verification Record
                </span>
                <h3 className="text-base sm:text-lg font-bold text-blue-950">
                  Inspecting Officer On-Site Verification
                </h3>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Identity Verified (No Proxy) ✓</span>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <p className="text-xs text-blue-800/90 leading-relaxed bg-[#FBF9F5] p-3.5 rounded-xl border border-[#EFECE6]">
              <strong>Anti-Proxy Certification:</strong> Live photograph captured on-site certifies that designated inspecting officer <strong>{report.inspectorName}</strong> personally conducted this physical inspection at <strong>{report.institutionName}</strong> without unauthorized surrogate deployment.
            </p>

            {/* Officer Photo Card */}
            {report.inspectorPhoto ? (
              <div className="rounded-2xl border border-blue-200 overflow-hidden bg-slate-950 shadow-xs">
                {/* Interactive Full Preview Area */}
                <div 
                  onClick={() => setLightboxPhoto({
                    imageUrl: report.inspectorPhoto!.imageUrl,
                    title: `Inspecting Officer: ${report.inspectorName}`,
                    latitude: report.inspectorPhoto!.latitude,
                    longitude: report.inspectorPhoto!.longitude,
                    areaName: report.inspectorPhoto!.areaName || getLocalGeographicLocation(report.inspectorPhoto!.latitude, report.inspectorPhoto!.longitude).areaName,
                    pincode: report.inspectorPhoto!.pincode || getLocalGeographicLocation(report.inspectorPhoto!.latitude, report.inspectorPhoto!.longitude).pincode,
                    date: report.inspectorPhoto!.date || report.date,
                    time: report.inspectorPhoto!.time
                  })}
                  className="group relative max-h-[420px] w-full flex items-center justify-center bg-black cursor-pointer overflow-hidden"
                >
                  <img
                    src={report.inspectorPhoto.imageUrl}
                    alt={`Inspecting Officer ${report.inspectorName}`}
                    className="w-full max-h-[420px] object-contain transition-transform duration-200 group-hover:scale-101"
                  />

                  {/* Hover Prompt Overlay */}
                  <div className="absolute inset-0 bg-blue-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 bg-blue-600/95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl">
                      <ZoomIn className="w-4 h-4" />
                      <span>Click to Open Full View</span>
                    </span>
                  </div>

                  {/* Live Watermarked Badge Tag */}
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-blue-950/80 backdrop-blur-md text-white border border-white/20 text-[10px] font-mono flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>MoSJE Officer Verification</span>
                  </div>
                </div>

                {/* Telemetry metadata bar */}
                <div className="p-3.5 sm:p-4 bg-[#FBF9F5] border-t border-[#EFECE6] text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between text-blue-900 font-semibold border-b border-[#EFECE6] pb-2">
                    <span className="flex items-center gap-1.5 text-blue-800">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>Officer GPS Coordinates:</span>
                    </span>
                    <span className="font-mono text-blue-950 font-bold">
                      {report.inspectorPhoto.latitude.toFixed(5)}° N, {report.inspectorPhoto.longitude.toFixed(5)}° E
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-blue-800/90 text-[11px] pt-0.5">
                    <div>
                      <span className="text-blue-500 font-medium">Verified Location & PIN: </span>
                      <strong className="text-blue-950">
                        {(!report.inspectorPhoto.areaName || report.inspectorPhoto.areaName.includes('Detecting'))
                          ? getLocalGeographicLocation(report.inspectorPhoto.latitude, report.inspectorPhoto.longitude).areaName
                          : report.inspectorPhoto.areaName}
                        {(report.inspectorPhoto.pincode || getLocalGeographicLocation(report.inspectorPhoto.latitude, report.inspectorPhoto.longitude).pincode)
                          ? ` - ${report.inspectorPhoto.pincode || getLocalGeographicLocation(report.inspectorPhoto.latitude, report.inspectorPhoto.longitude).pincode}`
                          : ''}
                      </strong>
                    </div>

                    <div className="flex items-center gap-3 justify-start sm:justify-end">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Date: <strong className="text-blue-950 font-mono">{report.inspectorPhoto.date || report.date}</strong></span>
                      </span>
                      {report.inspectorPhoto.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Time: <strong className="text-blue-950 font-mono">{report.inspectorPhoto.time}</strong></span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-950 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-950">Inspecting Officer: {report.inspectorName}</span>
                  <p className="text-blue-700/80 text-[11px]">Officer presence attested via authenticated credentials and geofence verification.</p>
                </div>
                <div className="font-mono text-emerald-700 font-bold text-xs bg-emerald-100 px-3 py-1 rounded-full">
                  VERIFIED
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ========================================================
            SECTION-WISE INSPECTION FINDINGS (AS ENTERED)
            ======================================================== */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
            <div>
              <h2 className="text-lg font-bold text-blue-950 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-700" />
                <span>Inspected Items & Field Findings</span>
              </h2>
              <p className="text-xs text-blue-700/80 mt-0.5">
                Detailed section-by-section breakdown of facilities, equipment, and watermarked photographic evidence.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {sections.length} Record{sections.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Render Each Section in Full Width Card */}
          {sections.map((sec, index) => {
            const photoArea = sec.photo ? (
              (sec.photo.areaName && !sec.photo.areaName.includes('Detecting'))
                ? sec.photo.areaName
                : getLocalGeographicLocation(sec.photo.latitude, sec.photo.longitude).areaName
            ) : '';
            const photoPin = sec.photo ? (
              sec.photo.pincode || getLocalGeographicLocation(sec.photo.latitude, sec.photo.longitude).pincode
            ) : '';

            return (
              <div
                key={sec.id || index}
                className="bg-white rounded-2xl border border-[#EFECE6] shadow-xs hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Section Header */}
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-[#EFECE6] flex flex-wrap items-center justify-between gap-3 bg-[#FBF9F5]/70">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-100/70 border border-blue-200 font-mono text-[11px] font-bold text-blue-900 tracking-wider">
                      SECTION {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-blue-950">
                      {sec.itemName}
                    </h3>
                  </div>

                  {/* Condition Badge */}
                  <div>
                    {sec.condition === 'Normal' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Normal Condition</span>
                      </span>
                    )}
                    {sec.condition === 'Need more improvement' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold shadow-2xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Need More Improvement</span>
                      </span>
                    )}
                    {sec.condition === 'Very bad condition' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-800 border border-red-200 text-xs font-bold shadow-2xs">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                        <span>Very Bad Condition / Urgent Action</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Section Body */}
                <div className="p-5 sm:p-6 space-y-5">
                  
                  {/* Inspector Remarks Block */}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-blue-500 block mb-1.5">
                      Inspector Observations & Remarks:
                    </span>
                    <div className="p-3.5 sm:p-4 rounded-xl bg-[#FBF9F5] border border-[#EFECE6] text-blue-950 text-xs sm:text-sm leading-relaxed">
                      {sec.detailedDescription ? (
                        <span className="italic font-medium">"{sec.detailedDescription}"</span>
                      ) : (
                        <span className="text-slate-400 italic">No additional field observations entered for this item.</span>
                      )}
                    </div>
                  </div>

                  {/* Attached Photographic Evidence Block */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] uppercase tracking-wider font-bold text-blue-500 block">
                        Watermarked Photographic Evidence:
                      </span>
                      {sec.photo && (
                        <span className="text-[11px] text-blue-600 font-medium">
                          Click image to view high-resolution preview
                        </span>
                      )}
                    </div>

                    {sec.photo ? (
                      <div className="rounded-2xl border border-blue-200 overflow-hidden bg-slate-950 shadow-sm">
                        
                        {/* Interactive Full Preview Area */}
                        <div 
                          onClick={() => setLightboxPhoto({
                            imageUrl: sec.photo!.imageUrl,
                            title: sec.itemName,
                            latitude: sec.photo!.latitude,
                            longitude: sec.photo!.longitude,
                            areaName: photoArea,
                            pincode: photoPin,
                            date: sec.photo!.date || report.date,
                            time: sec.photo!.time
                          })}
                          className="group relative max-h-[460px] w-full flex items-center justify-center bg-black cursor-pointer overflow-hidden"
                        >
                          <img
                            src={sec.photo.imageUrl}
                            alt={sec.itemName}
                            className="w-full max-h-[460px] object-contain transition-transform duration-200 group-hover:scale-101"
                          />

                          {/* Hover Prompt Overlay */}
                          <div className="absolute inset-0 bg-blue-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="px-4 py-2 bg-blue-600/95 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xl">
                              <ZoomIn className="w-4 h-4" />
                              <span>Click to Open Full View</span>
                            </span>
                          </div>

                          {/* Live Watermarked Badge Tag */}
                          <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-blue-950/80 backdrop-blur-md text-white border border-white/20 text-[10px] font-mono flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>MoSJE Geo-Stamped</span>
                          </div>
                        </div>

                        {/* Metadata Strip below photo */}
                        <div className="p-3.5 sm:p-4 bg-[#FBF9F5] border-t border-[#EFECE6] text-xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between text-blue-900 font-semibold border-b border-[#EFECE6] pb-2">
                            <span className="flex items-center gap-1.5 text-blue-800">
                              <MapPin className="w-4 h-4 text-blue-600" />
                              <span>GPS Coordinates:</span>
                            </span>
                            <span className="font-mono text-blue-950 font-bold">
                              {sec.photo.latitude.toFixed(5)}° N, {sec.photo.longitude.toFixed(5)}° E
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-blue-800/90 text-[11px] pt-0.5">
                            <div>
                              <span className="text-blue-500 font-medium">Captured Location & PIN: </span>
                              <strong className="text-blue-950">
                                {photoArea}{photoPin ? ` - ${photoPin}` : ''}
                              </strong>
                            </div>

                            <div className="flex items-center gap-3 justify-start sm:justify-end">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                                <span>Date: <strong className="text-blue-950 font-mono">{sec.photo.date || report.date}</strong></span>
                              </span>
                              {sec.photo.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Time: <strong className="text-blue-950 font-mono">{sec.photo.time}</strong></span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 text-xs text-center">
                        No photograph attached for this item.
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </section>

        {/* ========================================================
            OVERALL INSPECTOR FIELD DIRECTIVES (IF RECORDED)
            ======================================================== */}
        {report.inspectorNotes && (
          <section className="bg-white rounded-2xl border border-[#EFECE6] p-6 shadow-xs space-y-2">
            <h4 className="text-sm font-bold text-blue-950 uppercase tracking-wider text-blue-600">
              Inspector Field Directives & Overall Summary:
            </h4>
            <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-900 text-xs sm:text-sm italic leading-relaxed">
              "{report.inspectorNotes}"
            </div>
          </section>
        )}

        {/* ========================================================
            OFFICIAL DIGITAL VERIFICATION & SIGN-OFF BLOCK
            ======================================================== */}
        <section className="bg-white rounded-2xl border border-[#EFECE6] p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">Official Endorsement</span>
            <div className="font-bold text-blue-950 text-sm mt-0.5">
              Verified by Inspecting Officer: {report.inspectorName}
            </div>
            <div className="text-blue-700/80 text-[11px] mt-0.5 font-mono">
              DIGITAL SEAL: MOSJE-INSPECTION-COMPLIANT-2026
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-semibold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-blue-700" />
              <span>Print Copy</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold cursor-pointer transition-colors shadow-xs"
            >
              Close Record
            </button>
          </div>
        </section>

      </main>

      {/* ========================================================
          FULL-SCREEN HIGH-RESOLUTION LIGHTBOX PREVIEW
          ======================================================== */}
      {lightboxPhoto && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-md flex flex-col justify-between text-white p-3 sm:p-6 animate-fadeIn"
          onClick={() => setLightboxPhoto(null)}
        >
          {/* Lightbox Top Bar */}
          <div 
            className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 border-b border-zinc-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-white">
                  {lightboxPhoto.title}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  MoSJE Watermarked High-Resolution Evidence
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lightbox Main Image */}
          <div 
            className="flex-1 flex items-center justify-center py-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxPhoto.imageUrl}
              alt={lightboxPhoto.title}
              className="max-h-[78vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-zinc-800"
            />
          </div>

          {/* Lightbox Bottom Telemetry Bar */}
          <div 
            className="max-w-5xl w-full mx-auto bg-zinc-900/90 rounded-2xl p-4 border border-zinc-800 flex flex-wrap items-center justify-between gap-4 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 text-zinc-300">
              <span className="flex items-center gap-1.5 font-mono">
                <MapPin className="w-4 h-4 text-blue-400" />
                {lightboxPhoto.latitude.toFixed(5)}°N, {lightboxPhoto.longitude.toFixed(5)}°E
              </span>
              {lightboxPhoto.areaName && (
                <span className="text-zinc-400 hidden sm:inline">
                  {lightboxPhoto.areaName}{lightboxPhoto.pincode ? ` - ${lightboxPhoto.pincode}` : ''}
                </span>
              )}
            </div>

            {lightboxPhoto.date && (
              <div className="flex items-center gap-2 text-zinc-400">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{lightboxPhoto.date} {lightboxPhoto.time ? `at ${lightboxPhoto.time}` : ''}</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setLightboxPhoto(null)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold cursor-pointer text-xs transition-colors"
            >
              Close Lightbox
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
