import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { Audio } from 'expo-av';
import { vapiService } from '../services/vapiService';
import { CallState, VapiMessage } from '../types';

interface Props {
  userId: string;
}

export default function CompanionScreen({ userId }: Props) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [transcript, setTranscript] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    vapiService.onCallStart(() => {
      setCallState('in-call');
      setTranscript('');
    });

    vapiService.onCallEnd(() => {
      setCallState('idle');
    });

    vapiService.onError((err: unknown) => {
      setCallState('idle');
      const message = err instanceof Error ? err.message : String(err);
      Alert.alert('Error', message);
    });

    vapiService.onMessage((msg: VapiMessage) => {
      if (msg.type === 'transcript' && msg.transcript) {
        setTranscript((prev: string) => prev + msg.transcript);
      }
    });
  }, []);

  const handleTalkPress = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Microphone permission required', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() },
      ]);
      return;
    }
    setCallState('connecting');
    vapiService.startCall();
  };

  const handleEndPress = () => {
    vapiService.endCall();
    setCallState('ending');
  };

  return (
    <View style={styles.container}>
      {callState === 'idle' && (
        <TouchableOpacity style={styles.button} onPress={handleTalkPress}>
          <Text style={styles.buttonText}>Talk to Companion</Text>
        </TouchableOpacity>
      )}

      {callState === 'connecting' && (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.statusText}>Connecting...</Text>
          <TouchableOpacity style={[styles.button, styles.disabled]} disabled>
            <Text style={styles.buttonText}>Talk to Companion</Text>
          </TouchableOpacity>
        </View>
      )}

      {callState === 'in-call' && (
        <View style={styles.inCallContainer}>
          <TouchableOpacity style={[styles.button, styles.endButton]} onPress={handleEndPress}>
            <Text style={styles.buttonText}>End Call</Text>
          </TouchableOpacity>
          <ScrollView
            ref={scrollRef}
            style={styles.transcriptScroll}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            <Text style={styles.transcriptText}>{transcript}</Text>
          </ScrollView>
        </View>
      )}

      {callState === 'ending' && (
        <View style={styles.center}>
          <Text style={styles.statusText}>Ending...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  center: {
    alignItems: 'center',
    gap: 12,
  },
  button: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  endButton: {
    backgroundColor: '#DC2626',
  },
  disabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  inCallContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingTop: 24,
    gap: 16,
  },
  transcriptScroll: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  transcriptText: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
});
