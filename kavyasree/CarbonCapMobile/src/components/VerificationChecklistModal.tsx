import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as api from '@/services/api';

interface VerificationModalProps {
  visible: boolean;
  creditId: number;
  origin: string;
  ownerId: number;
  onClose: (didSucceed: boolean) => void;
}

type StepStatus = 'pending' | 'running' | 'success' | 'failed';

export function VerificationChecklistModal({
  visible,
  creditId,
  origin,
  ownerId,
  onClose,
}: VerificationModalProps) {
  const [step1, setStep1] = useState<StepStatus>('pending');
  const [step2, setStep2] = useState<StepStatus>('pending');
  const [step3, setStep3] = useState<StepStatus>('pending');
  const [step4, setStep4] = useState<StepStatus>('pending');
  const [result, setResult] = useState<{ success: boolean; signature?: string; reason?: string } | null>(null);
  const [inProgress, setInProgress] = useState(false);

  useEffect(() => {
    if (visible && !inProgress && !result) {
      runPipeline();
    }
  }, [visible]);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const runPipeline = async () => {
    setInProgress(true);
    setStep1('pending');
    setStep2('pending');
    setStep3('pending');
    setStep4('pending');
    setResult(null);

    try {
      // 1. Format check
      setStep1('running');
      await sleep(450);
      const formatMatch = /^([A-Za-z ]+):([A-Za-z0-9\-]+)$/.test(origin);
      if (!formatMatch) {
        setStep1('failed');
        setResult({ success: false, reason: `Origin '${origin}' does not match format 'Registry:ProjectID'` });
        setInProgress(false);
        return;
      }
      setStep1('success');

      // 2. Registry Whitelist check
      setStep2('running');
      await sleep(450);
      const regName = origin.split(':')[0].trim().toLowerCase();
      const allowed = ['verra', 'gold standard', 'american carbon registry', 'climate action reserve', 'plan vivo'];
      if (!allowed.includes(regName)) {
        setStep2('failed');
        setResult({ success: false, reason: `Unrecognized registry '${regName}'` });
        setInProgress(false);
        return;
      }
      setStep2('success');

      // 3. Duplicate check & signing API call
      setStep3('running');
      await sleep(450);

      const res = await api.signCredit(creditId);

      if (res.success) {
        setStep3('success');

        // 4. HMAC Signature Generation
        setStep4('running');
        await sleep(400);
        setStep4('success');

        setResult({
          success: true,
          reason: `Origin verified against '${regName}'`,
        });
      } else {
        setStep3('failed');
        setStep4('failed');
        setResult({
          success: false,
          reason: res.reason || res.error || 'Duplicate origin or signing error',
        });
      }
    } catch (e: any) {
      setStep1('failed');
      setResult({ success: false, reason: e.message || 'Verification failed' });
    } finally {
      setInProgress(false);
    }
  };

  const renderStep = (
    num: number,
    title: string,
    desc: string,
    status: StepStatus
  ) => {
    let iconBg = '#e2e8f0';
    let iconText = `${num}`;
    let border = '#e2e8f0';

    if (status === 'running') {
      iconBg = '#3b82f6';
      border = '#93c5fd';
    } else if (status === 'success') {
      iconBg = '#15803d';
      iconText = '✓';
      border = '#86efac';
    } else if (status === 'failed') {
      iconBg = '#dc2626';
      iconText = '✕';
      border = '#fca5a5';
    }

    return (
      <View style={[styles.stepItem, { borderColor: border }]}>
        <View style={[styles.stepIcon, { backgroundColor: iconBg }]}>
          {status === 'running' ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.stepIconText}>{iconText}</Text>
          )}
        </View>
        <View style={styles.stepInfo}>
          <Text style={styles.stepTitle}>{title}</Text>
          <Text style={styles.stepDesc}>{desc}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={() => !inProgress && onClose(!!result?.success)}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>🔐 Origin Verification Pipeline</Text>
            {!inProgress && (
              <TouchableOpacity onPress={() => onClose(!!result?.success)} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            {/* Target Credit Summary */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Credit ID</Text>
                <Text style={styles.summaryVal}>#{creditId}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Project Origin</Text>
                <Text style={styles.summaryVal}>{origin}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Owner Account</Text>
                <Text style={styles.summaryVal}>User #{ownerId}</Text>
              </View>
            </View>

            {/* Steps */}
            <View style={styles.stepsContainer}>
              {renderStep(
                1,
                'Format Check',
                'Matches Registry:ProjectID standard pattern',
                step1
              )}
              {renderStep(
                2,
                'Registry Whitelist Check',
                'Recognized carbon registry validation',
                step2
              )}
              {renderStep(
                3,
                'Duplicate Origin Check',
                'Ensures project ID was not previously claimed',
                step3
              )}
              {renderStep(
                4,
                'HMAC-SHA256 Signature',
                'Generates cryptographic verifier seal',
                step4
              )}
            </View>

            {/* Result Box */}
            {result && (
              <View
                style={[
                  styles.resultBox,
                  result.success ? styles.resultSuccess : styles.resultError,
                ]}
              >
                <Text style={styles.resultEmoji}>{result.success ? '🎉' : '🚫'}</Text>
                <Text style={styles.resultTitle}>
                  {result.success ? 'Origin Authenticated & Signed!' : 'Verification Rejected'}
                </Text>
                <Text style={styles.resultReason}>{result.reason}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, result?.success ? styles.btnSuccess : styles.btnSecondary]}
              disabled={inProgress}
              onPress={() => onClose(!!result?.success)}
            >
              <Text style={[styles.btnText, result?.success && styles.btnTextWhite]}>
                {inProgress ? 'Verifying Origin...' : 'Close & Refresh'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '700',
  },
  body: {
    padding: 16,
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 16,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  stepsContainer: {
    gap: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
  },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  stepDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  resultBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  resultSuccess: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  resultError: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  resultEmoji: {
    fontSize: 28,
    marginBottom: 4,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  resultReason: {
    fontSize: 12,
    color: '#334155',
    textAlign: 'center',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSuccess: {
    backgroundColor: '#15803d',
  },
  btnSecondary: {
    backgroundColor: '#e2e8f0',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  btnTextWhite: {
    color: '#ffffff',
  },
});
