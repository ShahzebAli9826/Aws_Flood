import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import {
  Target,
  Search,
  FileText,
  ChevronRight,
  RefreshCw,
  MapPin,
  Terminal,
  Check,
  Waves,
  CloudRain,
  Users,
  Compass,
  ExternalLink,
} from 'lucide-react-native';
import { apiService, DetectionResult } from '../services/api';

interface AgentPanelProps {
  lastResult: DetectionResult | null;
  activeLat: number;
  activeLon: number;
  onNavigateToMap?: () => void;
  onOpenReportModal?: () => void;
}

interface AgentResultSummary {
  location: string;
  severity: string;
  classification: string;
  area_sq_km: number;
  rainfall_5day_mm: number;
  gauge_status: string;
  confidence: number;
  population: number;
  buildings: number;
}

const PRESET_DISTRICTS = [
  { name: 'Patna District', lat: 25.6124, lon: 85.1376 },
  { name: 'Golaghat', lat: 26.5239, lon: 93.9632 },
  { name: 'Cachar', lat: 24.8333, lon: 92.7667 },
  { name: 'Jorhat', lat: 26.7509, lon: 94.2037 },
  { name: 'Majuli Island', lat: 26.9601, lon: 94.1802 },
  { name: 'Charaideo', lat: 27.0270, lon: 94.8872 },
  { name: 'Kaziranga', lat: 26.5775, lon: 93.1711 },
];

export const AgentPanel: React.FC<AgentPanelProps> = ({
  lastResult,
  activeLat,
  activeLon,
  onNavigateToMap,
  onOpenReportModal,
}) => {
  const [locationName, setLocationName] = useState<string>('Patna District');
  const [runningAgent, setRunningAgent] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [report, setReport] = useState<string>('');
  const [summary, setSummary] = useState<AgentResultSummary | null>(null);

  const triggerAgent = async () => {
    if (!locationName.trim()) {
      Alert.alert('Error', 'Please enter a target location.');
      return;
    }
    setRunningAgent(true);
    setLogs([]);
    setReport('');
    setSummary(null);

    try {
      let targetLat = activeLat;
      let targetLon = activeLon;

      const matched = PRESET_DISTRICTS.find(
        (d) => d.name.toLowerCase() === locationName.toLowerCase()
      );
      if (matched) {
        targetLat = matched.lat;
        targetLon = matched.lon;
      } else {
        const geo = await apiService.geocodePlace(locationName);
        if (
          geo.status === 'SUCCESS' &&
          typeof geo.lat === 'number' &&
          typeof geo.lon === 'number'
        ) {
          targetLat = geo.lat;
          targetLon = geo.lon;
        }
      }

      const response = await apiService.runAgentCycle(locationName, targetLat, targetLon);

      const logList = response.logs || response.result?.logs || [];
      const reportText = response.report || response.result?.report || '';
      const resultObj = response.result || response;

      if (logList.length > 0) {
        setLogs(logList);
        setReport(reportText);
        setSummary({
          location: resultObj.location || locationName,
          severity: resultObj.severity || 'NONE',
          classification: resultObj.classification || 'Normal Conditions / Dry Ground',
          area_sq_km: resultObj.area_sq_km || 0.0,
          rainfall_5day_mm: resultObj.rainfall_5day_mm || 0.0,
          gauge_status: resultObj.gauge_status || 'NORMAL',
          confidence: resultObj.confidence || 0,
          population: resultObj.population || 0,
          buildings: resultObj.buildings || 0,
        });
      } else {
        const trace = await apiService.getAgentTrace(locationName);
        if (trace && trace.logs && trace.logs.length > 0) {
          setLogs(trace.logs);
          setReport(trace.report || '');
          setSummary({
            location: trace.location || locationName,
            severity: trace.severity || 'NONE',
            classification: trace.classification || 'Normal Conditions / Dry Ground',
            area_sq_km: trace.area_sq_km || 0.0,
            rainfall_5day_mm: trace.rainfall_5day_mm || 0.0,
            gauge_status: trace.gauge_status || 'NORMAL',
            confidence: trace.confidence || 0,
            population: trace.population || 0,
            buildings: trace.buildings || 0,
          });
        }
      }
    } catch (e: any) {
      Alert.alert('Execution Notice', e.message || 'Agent cycle completed with fallback telemetry.');
    } finally {
      setRunningAgent(false);
    }
  };

  const getLogColor = (line: string) => {
    if (
      line.includes('CRITICAL') ||
      line.includes('DANGER') ||
      line.includes('ALERT') ||
      line.includes('Catastrophic')
    ) {
      return '#f87171'; // Red
    }
    if (
      line.includes('WARNING') ||
      line.includes('HIGH') ||
      line.includes('Threshold exceeded')
    ) {
      return '#fbbf24'; // Yellow
    }
    if (
      line.includes('STEP') ||
      line.includes('START') ||
      line.includes('COMPLETE')
    ) {
      return '#38bdf8'; // Sky blue
    }
    if (
      line.includes('SegFormer') ||
      line.includes('Sentinel') ||
      line.includes('NDWI') ||
      line.includes('ML')
    ) {
      return '#c084fc'; // Purple
    }
    return '#4ade80'; // Bright Green
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.centerContainer}>
        {/* ========================================================= */}
        {/* 1. HERO BANNER CARD (Pixel-matched with media_1790631247152) */}
        {/* ========================================================= */}
        <View style={styles.bannerWrapper}>
          {/* Left Column: Title, Subtitle, and Action Button */}
          <View style={styles.bannerLeftCol}>
            <Text style={styles.heroTitle}>Autonomous Agent{'\n'}Monitor</Text>

            <Text style={styles.heroSubtitle}>
              Trigger the FloodAgent loop to autonomously fetch coordinates, query
              real-time OpenWeather 5-day forecasts, evaluate CWC gauges, run satellite
              bands + SegFormer ML, and generate situation bulletins.
            </Text>

            <TouchableOpacity
              style={styles.viewMapBtn}
              onPress={onNavigateToMap}
              activeOpacity={0.85}
            >
              <RefreshCw size={13} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.viewMapBtnText}>View Map →</Text>
            </TouchableOpacity>
          </View>

          {/* Right Column: Satellite, Radar Scan, and Shield Artwork */}
          <View style={styles.bannerRightCol}>
            <Image
              source={require('../../assets/agent-banner-right-art.png')}
              style={styles.bannerRightArt}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* ========================================================= */}
        {/* 2. QUICK SELECT TARGET DISTRICT CARD                      */}
        {/* ========================================================= */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Target size={18} color="#0f172a" />
            <Text style={styles.cardHeaderTitle}>Quick Select Target District</Text>
          </View>

          {/* District Chips */}
          <View style={styles.chipsWrap}>
            {PRESET_DISTRICTS.map((d, i) => {
              const isActive = locationName.toLowerCase() === d.name.toLowerCase();
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.chip, isActive && styles.activeChip]}
                  onPress={() => setLocationName(d.name)}
                  activeOpacity={0.75}
                >
                  <MapPin
                    size={12}
                    color={isActive ? '#ffffff' : '#64748b'}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                    {d.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Search Input & Run Cycle Button Row */}
          <View style={styles.searchActionRow}>
            <View style={styles.searchInputContainer}>
              <Search size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={locationName}
                onChangeText={setLocationName}
                placeholder="Search or enter district..."
                placeholderTextColor="#94a3b8"
                autoCapitalize="words"
              />
            </View>

            <TouchableOpacity
              style={[styles.runCycleBtn, runningAgent && styles.runCycleBtnDisabled]}
              onPress={triggerAgent}
              disabled={runningAgent}
              activeOpacity={0.85}
            >
              {runningAgent ? (
                <>
                  <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.runCycleText}>Running...</Text>
                </>
              ) : (
                <>
                  <RefreshCw size={15} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.runCycleText}>Run Cycle</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================= */}
        {/* 3. ACTIVE REGIONAL DISASTER BRIEF CARD                    */}
        {/* ========================================================= */}
        <TouchableOpacity
          style={styles.briefCard}
          onPress={onOpenReportModal}
          activeOpacity={0.8}
        >
          <View style={styles.briefIconBadge}>
            <FileText size={22} color="#2563eb" />
          </View>
          <View style={styles.briefTextCol}>
            <Text style={styles.briefTitle}>Active Regional Disaster Brief</Text>
            <Text style={styles.briefSubtitle}>
              Select a village or run satellite inference on the map to generate the spatial
              impact report.
            </Text>
          </View>
          <ChevronRight size={18} color="#94a3b8" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        {/* ========================================================= */}
        {/* 4. LIVE PIPELINE LOGS (Shown when running or logs exist)  */}
        {/* ========================================================= */}
        {logs.length > 0 && (
          <View style={styles.consoleContainer}>
            <View style={styles.consoleHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Terminal size={15} color="#10b981" />
                <Text style={styles.consoleTitle}>Decision Trace & Pipeline Execution Logs</Text>
              </View>
              <View style={styles.liveBadge}>
                <Text style={styles.liveBadgeText}>
                  {runningAgent ? 'RUNNING...' : 'COMPLETED'}
                </Text>
              </View>
            </View>
            <ScrollView
              style={styles.consoleScroll}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {logs.map((logStr, idx) => (
                <Text key={idx} style={[styles.consoleText, { color: getLogColor(logStr) }]}>
                  {logStr}
                </Text>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ========================================================= */}
        {/* 5. ASSESSMENT SUMMARY KPI CARDS                          */}
        {/* ========================================================= */}
        {summary && (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>Assessment Summary: {summary.location}</Text>
              <View
                style={[
                  styles.severityBadge,
                  {
                    backgroundColor:
                      summary.severity === 'CRITICAL'
                        ? '#fee2e2'
                        : summary.severity === 'HIGH'
                        ? '#fef3c7'
                        : summary.severity === 'MODERATE'
                        ? '#e0f2fe'
                        : '#f0fdf4',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.severityBadgeText,
                    {
                      color:
                        summary.severity === 'CRITICAL'
                          ? '#dc2626'
                          : summary.severity === 'HIGH'
                          ? '#b45309'
                          : summary.severity === 'MODERATE'
                          ? '#0284c7'
                          : '#16a34a',
                    },
                  ]}
                >
                  {summary.severity} SEVERITY
                </Text>
              </View>
            </View>

            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <CloudRain size={18} color="#0284c7" />
                <Text style={styles.kpiValue}>{summary.rainfall_5day_mm} mm</Text>
                <Text style={styles.kpiLabel}>5-Day Rainfall</Text>
              </View>

              <View style={styles.kpiCard}>
                <Waves
                  size={18}
                  color={
                    summary.gauge_status === 'DANGER'
                      ? '#dc2626'
                      : summary.gauge_status === 'WARNING'
                      ? '#d97706'
                      : '#16a34a'
                  }
                />
                <Text
                  style={[
                    styles.kpiValue,
                    {
                      color:
                        summary.gauge_status === 'DANGER'
                          ? '#dc2626'
                          : summary.gauge_status === 'WARNING'
                          ? '#d97706'
                          : '#16a34a',
                    },
                  ]}
                >
                  {summary.gauge_status}
                </Text>
                <Text style={styles.kpiLabel}>CWC Gauge Status</Text>
              </View>

              <View style={styles.kpiCard}>
                <Compass size={18} color="#7c3aed" />
                <Text style={styles.kpiValue}>{summary.area_sq_km} km²</Text>
                <Text style={styles.kpiLabel}>Flooded Area</Text>
              </View>

              <View style={styles.kpiCard}>
                <Users size={18} color="#ea580c" />
                <Text style={styles.kpiValue}>{summary.population.toLocaleString()}</Text>
                <Text style={styles.kpiLabel}>Population at Risk</Text>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* 6. SITUATION BULLETIN REPORT OUTPUT                      */}
        {/* ========================================================= */}
        {report.length > 0 && (
          <View style={styles.reportContainer}>
            <View style={styles.reportHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Check size={16} color="#10b981" style={{ marginRight: 6 }} />
                <Text style={styles.reportTitle}>Agent Situation Bulletin Report</Text>
              </View>
              {onOpenReportModal && (
                <TouchableOpacity
                  onPress={onOpenReportModal}
                  style={styles.viewFullReportBtn}
                >
                  <ExternalLink size={12} color="#059669" style={{ marginRight: 4 }} />
                  <Text style={styles.viewFullReportText}>Full Modal</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled={true}>
              <Text style={styles.reportText}>{report}</Text>
            </ScrollView>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 95,
  },
  centerContainer: {
    width: '100%',
    maxWidth: 620,
    alignSelf: 'center',
  },

  /* Hero Banner */
  bannerWrapper: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    minHeight: 225,
  },
  bannerLeftCol: {
    flex: 1.15,
    paddingLeft: 16,
    paddingRight: 6,
    paddingTop: 16,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 10.5,
    color: '#475569',
    lineHeight: 14.5,
    fontWeight: '400',
    marginBottom: 10,
  },
  viewMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#059669',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 7,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  viewMapBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '700',
  },
  bannerRightCol: {
    flex: 0.95,
    overflow: 'hidden',
  },
  bannerRightArt: {
    width: '100%',
    height: '100%',
  },

  /* Card 2: Quick Select District */
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardHeaderTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeChip: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  chipText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  activeChipText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  searchActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: '#0f172a',
    fontSize: 13,
    paddingVertical: 0,
  },
  runCycleBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    height: 46,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  runCycleBtnDisabled: {
    opacity: 0.7,
  },
  runCycleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Card 3: Brief Card */
  briefCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  briefIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  briefTextCol: {
    flex: 1,
  },
  briefTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  briefSubtitle: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 3,
    lineHeight: 16,
  },

  /* Live Terminal Console */
  consoleContainer: {
    backgroundColor: '#090d16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 16,
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    paddingBottom: 8,
  },
  consoleTitle: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 7,
  },
  liveBadge: {
    backgroundColor: '#064e3b',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveBadgeText: {
    color: '#34d399',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  consoleScroll: {
    maxHeight: 220,
  },
  consoleText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 3,
  },

  /* Summary KPI Cards */
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  severityBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  severityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: 110,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 5,
  },
  kpiLabel: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 2,
  },

  /* Situation Bulletin Report */
  reportContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reportTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  viewFullReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  viewFullReportText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  reportText: {
    color: '#334155',
    fontSize: 11.5,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 17,
  },
});
