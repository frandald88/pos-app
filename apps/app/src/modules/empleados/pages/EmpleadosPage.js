import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  useEmpleadosData,
  useEmpleadosReports,
  useEmpleadosFilters
} from '../hooks';
import {
  AttendanceStatus,
  AttendanceControls,
  AttendanceReport
} from '../components';

// SVG Icons
const Icons = {
  vacation: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  chart: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
};

export default function EmployeesPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);

  // Hooks personalizados
  const {
    users,
    tiendas,
    currentUser,
    attendanceStatus,
    timeEntries,
    loading,
    msg,
    loadCurrentUser,
    loadUsers,
    loadTiendas,
    loadAttendanceStatus,
    handleCheckIn,
    handleCheckOut,
    handleAbsence,
    setMsg
  } = useEmpleadosData();

  const {
    reportData,
    reportStats,
    reportMsg,
    loading: reportLoading,
    loadAttendanceReport,
    setReportMsg
  } = useEmpleadosReports();

  const {
    selectedUser,
    absenceReason,
    entryType,
    exitType,
    reportUser,
    reportStartDate,
    reportEndDate,
    tiendaFiltro,
    setSelectedUser,
    setAbsenceReason,
    setExitType,
    setReportUser,
    setReportStartDate,
    setReportEndDate,
    setTiendaFiltro
  } = useEmpleadosFilters();

  // Cargar datos iniciales
  useEffect(() => {
    const initializeData = async () => {
      try {
        const userData = await loadCurrentUser();
        await loadUsers(userData);
        await loadTiendas();

        // Establecer usuario seleccionado
        if (userData.role !== 'admin') {
          setSelectedUser(userData._id);
        }
      } catch (error) {
        console.error('Error inicializando datos:', error);
      }
    };

    initializeData();
  }, []);

  // Cargar estado de asistencia cuando cambie el usuario seleccionado
  useEffect(() => {
    if (selectedUser && selectedUser.trim() !== '') {
      loadAttendanceStatus();
    }
  }, [selectedUser, loadAttendanceStatus]);

  // Handlers
  const onCheckIn = () => {
    handleCheckIn(selectedUser, currentUser?.tienda, entryType);
  };

  const onCheckOut = () => {
    handleCheckOut(selectedUser, exitType);
  };

  const onAbsence = async () => {
    const success = await handleAbsence(selectedUser, absenceReason);
    if (success) {
      setAbsenceReason('');
    }
  };

  const onGenerateReport = () => {
    loadAttendanceReport({
      reportUser,
      reportStartDate,
      reportEndDate,
      tiendaFiltro
    });
  };

  return (
    <div style={{ backgroundColor: '#f4f6fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1
                className="text-3xl font-bold mb-2"
                style={{ color: '#23334e' }}
              >
                Control de Asistencia
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Gestiona la asistencia y puntualidad de los empleados
              </p>
            </div>

            <div className="flex gap-3">
              <Link
                to="/vacaciones"
                className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md flex items-center gap-2"
                style={{ backgroundColor: '#46546b' }}
              >
                <Icons.vacation /> Solicitar Vacaciones
              </Link>

              {currentUser?.role === "admin" && (
                <button
                  onClick={() => setMostrarReporte(!mostrarReporte)}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2"
                  style={{
                    backgroundColor: '#8c95a4',
                    color: 'white'
                  }}
                >
                  <Icons.chart /> {mostrarReporte ? "Ocultar" : "Ver"} Reportes
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {msg && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            msg.includes('[SUCCESS]')
              ? 'bg-green-50 border-green-400 text-green-800'
              : 'bg-red-50 border-red-400 text-red-800'
          }`}>
            <p className="font-medium">{msg}</p>
          </div>
        )}

        {/* Estado actual de asistencia */}
        {selectedUser && (
          <AttendanceStatus
            attendanceStatus={attendanceStatus}
            timeEntries={timeEntries}
          />
        )}

        {/* Control de asistencia principal */}
        <AttendanceControls
          users={users}
          currentUser={currentUser}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          exitType={exitType}
          setExitType={setExitType}
          absenceReason={absenceReason}
          setAbsenceReason={setAbsenceReason}
          onCheckIn={onCheckIn}
          onCheckOut={onCheckOut}
          onAbsence={onAbsence}
          loading={loading}
        />

        {/* Sección de reportes (solo admin) */}
        {mostrarReporte && currentUser?.role === "admin" && (
          <AttendanceReport
            users={users}
            tiendas={tiendas}
            reportUser={reportUser}
            setReportUser={setReportUser}
            reportStartDate={reportStartDate}
            setReportStartDate={setReportStartDate}
            reportEndDate={reportEndDate}
            setReportEndDate={setReportEndDate}
            tiendaFiltro={tiendaFiltro}
            setTiendaFiltro={setTiendaFiltro}
            reportData={reportData}
            reportStats={reportStats}
            reportMsg={reportMsg}
            onGenerateReport={onGenerateReport}
            loading={reportLoading}
          />
        )}
      </div>
    </div>
  );
}
