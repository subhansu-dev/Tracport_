import React, { useState } from 'react';
import { 
  MapPin, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Search, 
  Building,
  HardDrive,
  Download,
  Eye,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Institution, InspectionReport } from '../types';
import { downloadReportToDeviceFile } from '../utils/deviceStorage';

interface InspectionListProps {
  institutions: Institution[];
  recentReports: InspectionReport[];
  onStartInspection: (institution: Institution) => void;
  onViewReport: (report: InspectionReport) => void;
}

export const InspectionList: React.FC<InspectionListProps> = ({
  institutions,
  recentReports,
  onStartInspection,
  onViewReport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Identify institution whose due date is closest
  // Sort institutions with SCHEDULED status by nextScheduledDate
  const scheduledList = [...institutions]
    .filter((i) => i.status !== 'COMPLETED')
    .sort((a, b) => new Date(a.nextScheduledDate).getTime() - new Date(b.nextScheduledDate).getTime());

  // Priority building (closest due date)
  const closestBuilding = scheduledList.length > 0 ? scheduledList[0] : institutions[0];

  // List of other institutions for the bottom half
  const filteredList = institutions.filter((inst) => {
    const q = searchQuery.toLowerCase();
    return (
      inst.name.toLowerCase().includes(q) ||
      inst.district.toLowerCase().includes(q) ||
      inst.category.toLowerCase().includes(q) ||
      inst.address.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 pb-12">
      
      {/* ========================================================
          4. MIDDLE PORTION: Closes Due Date (Large Area & Big Button)
          ======================================================== */}
      {closestBuilding && (
        <section aria-label="Closest Due Inspection">
          <div className="bg-white rounded-2xl border-2 border-blue-200 p-4 sm:p-8 shadow-xs hover:border-blue-300 transition-all">
            
            {/* Top Alert */}
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] sm:text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span>Next Due for Inspection</span>
              </div>
            </div>

            {/* Building Name (Large & Bold, responsive) */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-blue-950 tracking-tight leading-snug">
              {closestBuilding.name}
            </h2>

            {/* Key Inspection Details: Location, Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 my-4 sm:my-6 p-3.5 sm:py-4 sm:px-5 bg-blue-50/60 rounded-xl border border-blue-100">
              
              {/* Location */}
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-[11px] font-semibold uppercase text-blue-500 tracking-wider">
                    Building Location
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-blue-950 mt-0.5 break-words">
                    {closestBuilding.address}
                  </div>
                  <div className="text-xs text-blue-700/70">
                    {closestBuilding.district}, {closestBuilding.state}
                  </div>
                </div>
              </div>

              {/* Inspection Due Date */}
              <div className="flex items-start gap-2.5">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="text-[10px] sm:text-[11px] font-semibold uppercase text-blue-500 tracking-wider">
                    Inspection Due Date
                  </div>
                  <div className="text-xs sm:text-sm font-bold text-blue-950 mt-0.5">
                    {closestBuilding.nextScheduledDate}
                  </div>
                  <div className="text-xs text-blue-700/70">
                    {closestBuilding.status === 'COMPLETED' ? 'Completed' : 'Urgent Scheduled Visit'}
                  </div>
                </div>
              </div>

            </div>

            {/* Big Start Inspection Button */}
            <div className="pt-1">
              {closestBuilding.status === 'COMPLETED' ? (
                <div className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl font-bold text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Inspection Already Completed</span>
                </div>
              ) : (
                <button
                  onClick={() => onStartInspection(closestBuilding)}
                  className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm sm:text-base md:text-lg rounded-xl shadow-md hover:shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <span>Start Inspection</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>

          </div>
        </section>
      )}

      {/* ========================================================
          3. BOTTOM HALF: List of Rehabilitation Centres & Senior Citizen Homes
          ======================================================== */}
      <section aria-label="Building Inspection Schedule" className="space-y-4">
        
        {/* Section Header & Simple Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div>
            <h3 className="text-lg font-bold text-blue-950">
              Rehabilitation Centres & Senior Citizen Homes
            </h3>
            <p className="text-xs text-blue-700/70">
              List of all institutions scheduled for verification and inspection
            </p>
          </div>

          {/* Simple Minimalistic Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-blue-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-white border border-blue-200 rounded-xl text-blue-950 placeholder:text-blue-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Institution Items List */}
        <div className="space-y-3">
          {filteredList.map((building) => {
            const isCompleted = building.status === 'COMPLETED';

            return (
              <div
                key={building.id}
                className="bg-white rounded-xl border border-blue-100 p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left & Middle: Building Name, Location, Due Date */}
                <div className="space-y-2 flex-1">

                  {/* Building Name */}
                  <h4 className="text-base font-bold text-blue-950">
                    {building.name}
                  </h4>

                  {/* Location of that Building & Inspection Due Date */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-blue-800/80">
                    {/* Location */}
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{building.address}, {building.district}</span>
                    </div>

                    {/* Inspection Due */}
                    <div className="flex items-center gap-1.5 font-medium">
                      <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>
                        Inspection Due: <span className="font-bold text-blue-950">{building.nextScheduledDate}</span>
                      </span>
                    </div>
                  </div>

                </div>

                {/* Right Side: Small Start Inspection Option */}
                <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-blue-50">
                  {isCompleted ? (
                    <button
                      disabled
                      className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 flex items-center gap-1.5 cursor-default"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                      <span>Completed</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartInspection(building)}
                      className="w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Start Inspection</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div className="text-center py-10 bg-white rounded-xl border border-dashed border-blue-200">
              <Building className="w-8 h-8 text-blue-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-blue-900">No institutions found</p>
              <p className="text-xs text-blue-500 mt-1">Try searching with a different name or district</p>
            </div>
          )}
        </div>

      </section>

      {/* ========================================================
          SAVED ON DEVICE REPORTS (AVAILABLE OFFLINE ANYTIME)
          ======================================================== */}
      <section aria-label="Saved Device Reports" className="pt-2">
        <div className="bg-white rounded-2xl border border-blue-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EFECE6] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                <HardDrive className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-blue-950 flex items-center gap-2">
                  <span>Saved on Device Reports</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                    {recentReports.length} Available
                  </span>
                </h4>
                <p className="text-[11px] text-blue-700/70">
                  Stored securely on device storage · View, inspect, or export anytime offline
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[11px] font-medium self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Offline Device Storage Active</span>
            </div>
          </div>

          {recentReports.length > 0 ? (
            <div className="space-y-3">
              {recentReports.map((rep) => (
                <div
                  key={rep.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-[#FBF9F5] border border-blue-100 hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-blue-950 text-sm">{rep.institutionName}</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold">
                        {rep.grade || 'A+'} Grade
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-blue-800/80">
                      <span className="font-mono text-blue-600 font-semibold">
                        {rep.id}
                      </span>
                      <span>·</span>
                      <span>Inspection Date: <strong className="text-blue-950 font-mono">{rep.date}</strong></span>
                      <span>·</span>
                      <span>{rep.evidences.length} Geotagged Photo{rep.evidences.length !== 1 ? 's' : ''}</span>
                      {rep.inspectorPhoto && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Officer Selfie Verified
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#EFECE6]">
                    <button
                      type="button"
                      onClick={() => onViewReport(rep)}
                      className="flex-1 md:flex-none px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Report</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadReportToDeviceFile(rep)}
                      className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Download backup file to device"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span className="hidden sm:inline">Save File</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 sm:p-5 text-center bg-blue-50/40 rounded-xl border border-dashed border-blue-200 text-xs text-blue-800 space-y-1">
              <p className="font-bold text-blue-950">No reports submitted yet.</p>
              <p className="text-blue-600/80">
                Once an inspection report is submitted, it will be automatically saved locally on this device so you can access and view it at any time, even without an internet connection.
              </p>
            </div>
          )}
        </div>
      </section>

    </div>
  );
};
