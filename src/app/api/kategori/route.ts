import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'prisma', 'categories.json');

// Helper to read categories file or return default
function getCategories() {
  try {
    if (!fs.existsSync(filePath)) {
      const defaultCategories = {
        pemasukan: ['Sumbangan', 'Lain-lain'],
        pengeluaran: ['Kebersihan', 'Keamanan', 'Listrik & Air', 'Lain-lain']
      };
      fs.writeFileSync(filePath, JSON.stringify(defaultCategories, null, 2), 'utf-8');
      return defaultCategories;
    }
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading categories file:', error);
    return {
      pemasukan: ['Sumbangan', 'Lain-lain'],
      pengeluaran: ['Kebersihan', 'Keamanan', 'Listrik & Air', 'Lain-lain']
    };
  }
}

// Helper to save categories
function saveCategories(categories: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error writing categories file:', error);
    return false;
  }
}

// GET categories
export async function GET() {
  const categories = getCategories();
  return NextResponse.json(categories);
}

// POST add a category
export async function POST(request: Request) {
  try {
    const { type, name } = await request.json(); // type: "pemasukan" | "pengeluaran", name: string

    if (!type || !name || (type !== 'pemasukan' && type !== 'pengeluaran')) {
      return NextResponse.json({ error: 'Parameter tidak valid' }, { status: 400 });
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      return NextResponse.json({ error: 'Nama kategori tidak boleh kosong' }, { status: 400 });
    }

    const categories = getCategories();
    
    // Check duplication
    if (categories[type].some((c: string) => c.toLowerCase() === trimmedName.toLowerCase())) {
      return NextResponse.json({ error: 'Kategori sudah ada' }, { status: 400 });
    }

    categories[type].push(trimmedName);
    saveCategories(categories);

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal menambahkan kategori: ' + error.message }, { status: 500 });
  }
}

// PUT edit a category name
export async function PUT(request: Request) {
  try {
    const { type, oldName, newName } = await request.json();

    if (!type || !oldName || !newName || (type !== 'pemasukan' && type !== 'pengeluaran')) {
      return NextResponse.json({ error: 'Parameter tidak valid' }, { status: 400 });
    }

    const trimmedNewName = newName.trim();
    if (!trimmedNewName) {
      return NextResponse.json({ error: 'Nama kategori baru tidak boleh kosong' }, { status: 400 });
    }

    const categories = getCategories();

    const index = categories[type].findIndex((c: string) => c.toLowerCase() === oldName.toLowerCase());
    if (index === -1) {
      return NextResponse.json({ error: 'Kategori lama tidak ditemukan' }, { status: 404 });
    }

    // Check duplication with other items
    const isDup = categories[type].some((c: string, idx: number) => idx !== index && c.toLowerCase() === trimmedNewName.toLowerCase());
    if (isDup) {
      return NextResponse.json({ error: 'Nama kategori baru sudah digunakan' }, { status: 400 });
    }

    categories[type][index] = trimmedNewName;
    saveCategories(categories);

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal memperbarui kategori: ' + error.message }, { status: 500 });
  }
}

// DELETE a category
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // "pemasukan" | "pengeluaran"
    const name = searchParams.get('name');

    if (!type || !name || (type !== 'pemasukan' && type !== 'pengeluaran')) {
      return NextResponse.json({ error: 'Parameter tidak valid' }, { status: 400 });
    }

    const categories = getCategories();
    const index = categories[type].findIndex((c: string) => c.toLowerCase() === name.toLowerCase());
    
    if (index === -1) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
    }

    categories[type].splice(index, 1);
    saveCategories(categories);

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ error: 'Gagal menghapus kategori: ' + error.message }, { status: 500 });
  }
}
