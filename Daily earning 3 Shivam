// App.tsx
import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';

/**
 * ShowTotalButton Component
 * Props:
 *  - earnings: { amount: number }[]
 *  - style?: any
 */
interface ShowTotalButtonProps {
  earnings: { amount: number }[];
  style?: any;
}

const ShowTotalButton: React.FC<ShowTotalButtonProps> = ({ earnings, style }) => {
  const [show, setShow] = useState(false);
  const [total, setTotal] = useState(0);

  const calculateTotal = () => {
    const sum = earnings.reduce((acc, item) => acc + item.amount, 0);
    setTotal(sum);
    setShow(true);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.button} onPress={calculateTotal}>
        <Text style={styles.buttonText}>Calculate Total</Text>
      </TouchableOpacity>

      {show && (
        <View style={styles.totalDisplay}>
          <Text style={styles.totalDisplayText}>Total: ₹{total.toFixed(2)}</Text>
        </View>
      )}
    </View>
  );
};

/**
 * Main App Component
 */
export default function App() {
  const earnings = [
    { amount: 1200 },
    { amount: 850 },
    { amount: 500 },
    { amount: 1500 },
  ];

  return (
    <SafeAreaView style={styles.appContainer}>
      <Text style={styles.header}>Earnings Calculator 💰</Text>
      <ShowTotalButton earnings={earnings} />
    </SafeAreaView>
  );
}

/**
 * Styles
 */
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
  },
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    borderRadius: 12,
    width: '100%',
  },
  button: {
    padding: 16,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  totalDisplay: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  totalDisplayText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 24,
  },
});
