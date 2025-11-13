// App.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

/* ----------------- DailyEarningsInput ----------------- */
export function DailyEarningsInput({ onAdd, editing = null, onCancel }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editing) {
      setAmount(String(editing.amount ?? ''));
      setDate(editing.date ?? new Date().toISOString().slice(0, 10));
      setNote(editing.note ?? '');
    } else {
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
        <Pressable style={[styles.addButton, { flex: 1 }]} onPress={handleAddOrSave}>
          <Text style={styles.addButtonText}>{editing ? 'Save' : 'Add Earning'}</Text>
        </Pressable>

        {editing && (
          <Pressable
            style={[styles.cancelButton, { marginLeft: 10 }]}
            onPress={() => {
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

/* ----------------- EarningsList (with delete confirm) ----------------- */
export function EarningsList({
  earnings,
  onDelete,
  onEdit,
}) {
  const total = useMemo(() => earnings.reduce((s, e) => s + Number(e.amount || 0), 0), [earnings]);

  function confirmDelete(id) {
    Alert.alert('Delete', 'Delete this earning?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete && onDelete(id),
      },
    ]);
  }

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
            <Pressable onPress={() => onEdit && onEdit(item)} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
              <Text>Edit</Text>
            </Pressable>

            <Pressable onPress={() => confirmDelete(item.id)} style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.6 }]}>
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
        <FlatList data={earnings} keyExtractor={(i) => i.id} renderItem={renderItem} />
      )}
    </View>
  );
}

/* ----------------- App with pagination & sorting ----------------- */
export default function App() {
  const [earnings, setEarnings] = useState([]);
  const [editing, setEditing] = useState(null);

  // Pagination + sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5); // options: 5,10,20
  const [sortBy, setSortBy] = useState('date'); // 'date' or 'amount'
  const [sortDir, setSortDir] = useState('desc'); // 'asc' or 'desc'

  useEffect(() => {
    // whenever earnings / sorting / pageSize change, ensure page is valid
    setPage(1);
  }, [earnings.length, pageSize, sortBy, sortDir]);

  function handleAdd(item) {
    setEarnings((prev) => {
      const exists = prev.some((p) => p.id === item.id);
      if (exists) {
        return prev.map((p) => (p.id === item.id ? item : p));
      }
      return [item, ...prev];
    });
    setEditing(null);
  }

  function handleDelete(id) {
    setEarnings((p) => p.filter((x) => x.id !== id));
  }

  function handleEdit(item) {
    setEditing(item);
  }

  // Sorted list (unpaginated)
  const sorted = useMemo(() => {
    const arr = [...earnings];
    if (sortBy === 'date') {
      arr.sort((a, b) => {
        // date strings in YYYY-MM-DD -> can compare lexicographically
        if (a.date === b.date) return 0;
        return sortDir === 'asc' ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date);
      });
    } else {
      arr.sort((a, b) => {
        const na = Number(a.amount || 0), nb = Number(b.amount || 0);
        return sortDir === 'asc' ? na - nb : nb - na;
      });
    }
    return arr;
  }, [earnings, sortBy, sortDir]);

  // Pagination: compute total pages and slice current page
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(totalPages, Math.max(1, page));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, currentPage, pageSize]);

  function nextPage() {
    setPage((p) => Math.min(totalPages, p + 1));
  }
  function prevPage() {
    setPage((p) => Math.max(1, p - 1));
  }
  function changePageSize(size) {
    setPageSize(size);
    setPage(1);
  }
  function toggleSort(by) {
    if (sortBy === by) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(by);
      setSortDir('desc');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Earnings Tracker</Text>

      {editing && (
        <View style={styles.editBanner}><Text>Editing item — update fields & press Save</Text></View>
      )}

      <DailyEarningsInput onAdd={handleAdd} editing={editing} onCancel={() => setEditing(null)} />

      {/* Controls: sorting and pagination */}
      <View style={styles.controlsRow}>
        <View style={styles.sortGroup}>
          <Text style={styles.controlLabel}>Sort:</Text>
          <Pressable style={[styles.sortBtn, sortBy === 'date' && styles.sortActive]} onPress={() => toggleSort('date')}>
            <Text style={styles.sortBtnText}>Date {sortBy === 'date' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</Text>
          </Pressable>
          <Pressable style={[styles.sortBtn, sortBy === 'amount' && styles.sortActive]} onPress={() => toggleSort('amount')}>
            <Text style={styles.sortBtnText}>Amount {sortBy === 'amount' ? (sortDir === 'asc' ? '↑' : '↓') : ''}</Text>
          </Pressable>
        </View>

        <View style={styles.pageGroup}>
          <Text style={styles.controlLabel}>Page size:</Text>
          <Pressable style={[styles.pageSizeBtn, pageSize === 5 && styles.pageSizeActive]} onPress={() => changePageSize(5)}>
            <Text>5</Text>
          </Pressable>
          <Pressable style={[styles.pageSizeBtn, pageSize === 10 && styles.pageSizeActive]} onPress={() => changePageSize(10)}>
            <Text>10</Text>
          </Pressable>
          <Pressable style={[styles.pageSizeBtn, pageSize === 20 && styles.pageSizeActive]} onPress={() => changePageSize(20)}>
            <Text>20</Text>
          </Pressable>
        </View>
      </View>
      <EarningsList earnings={paginated} onDelete={handleDelete} onEdit={handleEdit} />


      {/* Pagination footer */}
      <View style={styles.paginationFooter}>
        <Pressable style={styles.pageControl} onPress={prevPage}>
          <Text>Prev</Text>
        </Pressable>

        <Text style={styles.pageInfo}>Page {currentPage} / {totalPages}  •  Total {sorted.length} items</Text>

        <Pressable style={styles.pageControl} onPress={nextPage}>
          <Text>Next</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ----------------- Styles ----------------- */
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
    marginTop: 8,
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

  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sortGroup: { flexDirection: 'row', alignItems: 'center' },
  controlLabel: { marginRight: 8, fontWeight: '600' },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginRight: 8, backgroundColor: '#eef2ff' },
  sortActive: { backgroundColor: '#c7d2fe' },
  sortBtnText: { fontWeight: '700' },

  pageGroup: { flexDirection: 'row', alignItems: 'center' },
  pageSizeBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, marginLeft: 6, backgroundColor: '#fff' },
  pageSizeActive: { backgroundColor: '#e6f0ff' },

  paginationFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  pageControl: { padding: 8, backgroundColor: '#fff', borderRadius: 8 },
  pageInfo: { fontWeight: '600' },
});
  