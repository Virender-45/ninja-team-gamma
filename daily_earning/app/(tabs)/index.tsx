import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * DailyEarningsInput
 * Props:
 *  - onAdd(earning) : called with { id, amount, date, note }
 *  - editing : optional object being edited { id, amount, date, note }
 *  - onCancel : optional callback to cancel editing
 */
export function DailyEarningsInput({ onAdd, editing = null, onCancel }) {
  // keep inputs as strings for TextInput
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [note, setNote] = useState('');

  // when editing prop changes, prefill inputs
  useEffect(() => {
    if (editing) {
      setAmount(String(editing.amount ?? ''));
      setDate(editing.date ?? new Date().toISOString().slice(0, 10));
      setNote(editing.note ?? '');
    } else {
      // if no editing, reset to defaults
      reset();
    }
  }, [editing]);

  function reset() {
    setAmount('');
    setDate(new Date().toISOString().slice(0, 10));
    setNote('');
  }

  function handleAddOrSave() {
    const parsed = parseFloat(amount);
    if (Number.isNaN(parsed) || parsed <= 0) {
      Alert.alert('Invalid amount', 'Please enter a positive number for amount');
      return;
    }

    const payload = {
      id: editing?.id ?? String(Date.now()),
      amount: parsed,
      date,
      note: note.trim(),
    };

    onAdd(payload);
    // if we were editing, parent will clear editing; still reset local state
    reset();
  }

  return (
    <View style={styles.inputCard}>
      <Text style={styles.label}>Amount (₹)</Text>
      <TextInput
        placeholder="eg. 2500"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
      />

      <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
      <TextInput value={date} onChangeText={setDate} style={styles.input} />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        placeholder="optional note"
        value={note}
        onChangeText={setNote}
        style={styles.input}
      />

      <View style={{ flexDirection: 'row', marginTop: 12 }}>
        <Pressable
          style={[styles.addButton, { flex: 1 }]}
          onPress={handleAddOrSave}
        >
          <Text style={styles.addButtonText}>{editing ? 'Save' : 'Add Earning'}</Text>
        </Pressable>

        {editing && (
          <Pressable
            style={[styles.cancelButton, { marginLeft: 10 }]}
            onPress={() => {
              // clear form and notify parent to cancel editing
              reset();
              onCancel && onCancel();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

/**
 * EarningsList
 * Props:
 *  - earnings: array
 *  - onDelete(id)
 *  - onEdit(item)
 */
export function EarningsList({ earnings, onDelete, onEdit }) {
  const total = useMemo(
    () => earnings.reduce((s, e) => s + Number(e.amount || 0), 0),
    [earnings]
  );

  function renderItem({ item }) {
    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowDate}>{item.date}</Text>
          <Text style={styles.rowNote}>{item.note || '—'}</Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.rowAmount}>₹{Number(item.amount).toFixed(2)}</Text>
          <View style={styles.rowButtons}>
            <Pressable
              onPress={() => onEdit && onEdit(item)}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            >
              <Text>Edit</Text>
            </Pressable>

            <Pressable
              onPress={() => onDelete && onDelete(item.id)}
              style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}
            >
              <Text style={{ color: 'red' }}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.listCard}>
      <View style={styles.listHeader}>
        <Text style={styles.title}>Daily earnings</Text>
        <Text style={styles.total}>Total: ₹{total.toFixed(2)}</Text>
      </View>

      {earnings.length === 0 ? (
        <View style={styles.empty}><Text>No earnings yet — add one above.</Text></View>
      ) : (
        <FlatList
          data={[...earnings].sort((a, b) => b.date.localeCompare(a.date))}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

// App (uses the components above)
export default function App() {
  const [earnings, setEarnings] = useState([]);
  const [editing, setEditing] = useState(null);

  function handleAdd(item) {
    // if item has an id that already exists -> update existing
    setEarnings((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      if (exists) {
        return prev.map((p) => (p.id === item.id ? item : p));
      }
      // new item -> add at top
      return [item, ...prev];
    });

    // clear editing state after save
    setEditing(null);
  }

  function handleDelete(id) {
    Alert.alert('Delete', 'Delete this earning?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setEarnings((p) => p.filter((x) => x.id !== id)) },
    ]);
  }

  function handleEdit(item) {
    // set the editing item so the form does the prefill
    setEditing(item);
    // do NOT remove it from the list — we will update it in place when saved
  }

  function handleCancelEdit() {
    setEditing(null);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Earnings Tracker</Text>

      {editing && (
        <View style={styles.editBanner}><Text>Editing item — update fields & press Save</Text></View>
      )}

      <DailyEarningsInput
        onAdd={handleAdd}
        editing={editing}
        onCancel={handleCancelEdit}
      />

      <EarningsList earnings={earnings} onDelete={handleDelete} onEdit={handleEdit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f7fa',
    paddingTop: 48,
  },
  header: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  inputCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 1,
  },
  label: { fontSize: 12, color: '#333', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e6e9ef',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  addButton: {
    backgroundColor: '#0b84ff',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: { color: 'white', fontWeight: '700' },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { color: '#333', fontWeight: '700' },

  listCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
  },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  total: { fontSize: 16, fontWeight: '700' },
  empty: { padding: 20, alignItems: 'center' },
  row: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#f0f2f5' },
  rowDate: { fontSize: 13, fontWeight: '600' },
  rowNote: { fontSize: 12, color: '#666' },
  rowAmount: { fontSize: 15, fontWeight: '700' },
  rowButtons: { flexDirection: 'row', marginTop: 8 },
  iconBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  editBanner: { backgroundColor: '#fff3cd', padding: 8, borderRadius: 8, marginBottom: 8 },
});
