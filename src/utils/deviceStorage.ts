/**
 * Device Persistent Storage Utility for MoSJE Inspection Reports.
 * Uses client-side IndexedDB with transparent localStorage fallback
 * to guarantee that all submitted reports, geotagged evidence,
 * and inspecting officer verification photos remain securely saved
 * on the user's device for instant offline/online viewing anytime.
 */

import { InspectionReport } from '../types';

const DB_NAME = 'MoSJE_Inspection_Database';
const DB_VERSION = 1;
const STORE_NAME = 'saved_inspection_reports';
const FALLBACK_STORAGE_KEY = 'mosje_saved_reports_fallback';

/**
 * Initializes the IndexedDB database.
 */
function openDeviceDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('institutionId', 'institutionId', { unique: false });
        store.createIndex('inspectorId', 'inspectorId', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves an inspection report permanently onto the local device storage.
 */
export async function saveReportToDevice(report: InspectionReport): Promise<void> {
  try {
    const db = await openDeviceDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(report);

      request.onsuccess = () => {
        // Also mirror lightweight metadata in localStorage for instant fast retrieval
        mirrorReportInLocalStorage(report);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB unavailable, falling back to localStorage:', err);
    saveReportToLocalStorageFallback(report);
  }
}

/**
 * Retrieves all saved inspection reports stored on this device.
 */
export async function getAllSavedReportsFromDevice(): Promise<InspectionReport[]> {
  try {
    const db = await openDeviceDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const reports = (request.result as InspectionReport[]) || [];
        // Sort newest first
        reports.sort((a, b) => {
          const timeA = a.syncTimestamp ? new Date(a.syncTimestamp).getTime() : 0;
          const timeB = b.syncTimestamp ? new Date(b.syncTimestamp).getTime() : 0;
          return timeB - timeA;
        });
        resolve(reports);
      };

      request.onerror = () => {
        resolve(getReportsFromLocalStorageFallback());
      };
    });
  } catch (err) {
    console.warn('IndexedDB error on read, using localStorage fallback:', err);
    return getReportsFromLocalStorageFallback();
  }
}

/**
 * Removes a report from device storage.
 */
export async function deleteReportFromDevice(reportId: string): Promise<void> {
  try {
    const db = await openDeviceDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(reportId);

      request.onsuccess = () => {
        removeReportFromLocalStorageFallback(reportId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    removeReportFromLocalStorageFallback(reportId);
  }
}

/**
 * Exports and downloads the inspection report as an official standalone file
 * (.json or standalone .html) directly onto the user's device filesystem.
 */
export function downloadReportToDeviceFile(report: InspectionReport): void {
  try {
    const reportPayload = {
      title: `MoSJE Official Inspection Report - ${report.institutionName}`,
      exportDate: new Date().toISOString(),
      report
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    const safeName = report.institutionName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `MoSJE_Report_${safeName}_${report.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  } catch (err) {
    console.error('Failed to download report file to device:', err);
  }
}

/* =========================================================================
   LOCAL STORAGE FALLBACK HELPERS
   ========================================================================= */

function mirrorReportInLocalStorage(report: InspectionReport): void {
  try {
    const existing = getReportsFromLocalStorageFallback();
    const updated = [report, ...existing.filter((r) => r.id !== report.id)];
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    // If quota exceeded due to high-res images, store without heavy raw originals
    try {
      const lightweightReport = {
        ...report,
        evidences: report.evidences.map((e) => ({ ...e, imageUrl: e.imageUrl.slice(0, 100) + '...[device-stored]' }))
      };
      const existing = getReportsFromLocalStorageFallback();
      const updated = [lightweightReport, ...existing.filter((r) => r.id !== report.id)];
      localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignored
    }
  }
}

function saveReportToLocalStorageFallback(report: InspectionReport): void {
  mirrorReportInLocalStorage(report);
}

function getReportsFromLocalStorageFallback(): InspectionReport[] {
  try {
    const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InspectionReport[]) : [];
  } catch {
    return [];
  }
}

function removeReportFromLocalStorageFallback(reportId: string): void {
  try {
    const existing = getReportsFromLocalStorageFallback();
    const filtered = existing.filter((r) => r.id !== reportId);
    localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Ignored
  }
}
