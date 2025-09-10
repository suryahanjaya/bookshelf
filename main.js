document.addEventListener("DOMContentLoaded", () => {
    const STORAGE_KEY = "bookshelfData";
    let books = [];
    let currentBookIdToDelete = null;
    let currentFilter = 'all';
    let booksPerYearChart;

    const bookForm = document.getElementById("bookForm");
    const searchInput = document.getElementById("searchBookTitle");
    const incompleteBookList = document.getElementById("incompleteBookList");
    const completeBookList = document.getElementById("completeBookList");
    const editModal = document.getElementById('editModal');
    const editBookForm = document.getElementById('editBookForm');
    const closeModalBtn = document.getElementById('closeModal');
    const confirmationDialog = document.getElementById('confirmationDialog');
    const dialogConfirmBtn = document.getElementById('dialogConfirm');
    const dialogCancelBtn = document.getElementById('dialogCancel');
    const sortSelect = document.getElementById('sortOptions');
    const notesModal = document.getElementById('notesModal');
    const notesForm = document.getElementById('notesForm');
    const datetimeContainer = document.getElementById('datetime-container');

    const isStorageExist = () => typeof(Storage) !== "undefined";

    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    const saveBooks = () => {
        if (isStorageExist()) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
            document.dispatchEvent(new Event("booksChanged"));
        }
    };

    const loadBooks = () => {
        if (isStorageExist()) {
            const storedData = localStorage.getItem(STORAGE_KEY);
            books = storedData ? JSON.parse(storedData) : [];
            document.dispatchEvent(new Event("booksChanged"));
        }
    };

    const generateId = () => +new Date();

    const createBookElement = (book) => {
        const bookItem = document.createElement("div");
        bookItem.classList.add("book-item");
        bookItem.setAttribute("data-bookid", book.id);
        bookItem.setAttribute("data-testid", "bookItem");
        if (book.isFavorite) bookItem.classList.add('is-favorite');

        const statusClass = book.isComplete ? "status-complete" : "status-incomplete";
        const statusText = book.isComplete ? "Selesai dibaca" : "Belum selesai";
        const toggleButtonText = book.isComplete ? "Baca Lagi" : "Selesai";
        const toggleButtonIcon = book.isComplete ? "fa-undo" : "fa-check";
        const toggleButtonClass = book.isComplete ? "btn-warning" : "btn-success";
        const favoriteIcon = book.isFavorite ? 'fas fa-star' : 'far fa-star';
        const favoriteClass = book.isFavorite ? 'btn-warning' : 'btn-secondary';
        const notesIndicatorClass = (book.notes && book.notes.length) ? 'notes-indicator has-notes' : 'notes-indicator';

        bookItem.innerHTML = `
            <div class="book-item-header">
                <h3 data-testid="bookItemTitle">${book.title}</h3>
                <i class="${notesIndicatorClass} fas fa-sticky-note" title="Ada catatan"></i>
            </div>
            <p data-testid="bookItemAuthor"><i class="fas fa-user"></i> ${book.author}</p>
            <p data-testid="bookItemYear"><i class="fas fa-calendar"></i> ${book.year}</p>
            <span class="book-status ${statusClass}">${statusText}</span>
            <div class="book-actions">
                <button class="btn ${toggleButtonClass}" data-action="toggleStatus" data-testid="bookItemIsCompleteButton">
                    <i class="fas ${toggleButtonIcon}"></i> ${toggleButtonText}
                </button>
                <button class="btn ${favoriteClass}" data-action="toggleFavorite">
                    <i class="${favoriteIcon}"></i> Favorit
                </button>
                <button class="btn btn-secondary" data-action="notes">
                    <i class="fas fa-sticky-note"></i> Catatan
                </button>
                <button class="btn btn-secondary" data-action="edit" data-testid="bookItemEditButton">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" data-action="delete" data-testid="bookItemDeleteButton">
                    <i class="fas fa-trash"></i> Hapus
                </button>
            </div>
        `;

        bookItem.querySelector('[data-action="toggleStatus"]').addEventListener('click', () => toggleBookStatus(book.id));
        bookItem.querySelector('[data-action="toggleFavorite"]').addEventListener('click', (e) => toggleFavorite(book.id, e.currentTarget));
        bookItem.querySelector('[data-action="edit"]').addEventListener('click', () => showEditModal(book.id));
        bookItem.querySelector('[data-action="delete"]').addEventListener('click', () => showDeleteConfirmation(book.id));
        bookItem.querySelector('[data-action="notes"]').addEventListener('click', () => showNotesModal(book.id));

        return bookItem;
    };
    
    const applySort = (arr) => {
        const mode = sortSelect.value;
        if (mode === 'title-asc') return arr.sort((a, b) => a.title.localeCompare(b.title));
        if (mode === 'title-desc') return arr.sort((a, b) => b.title.localeCompare(a.title));
        if (mode === 'year-asc') return arr.sort((a, b) => a.year - b.year);
        if (mode === 'year-desc') return arr.sort((a, b) => b.year - a.year);
        return arr;
    };

    const renderBooks = () => {
        incompleteBookList.innerHTML = "";
        completeBookList.innerHTML = "";

        let filteredBooks = books.slice();
        const keyword = searchInput.value.toLowerCase().trim();

        if (keyword) filteredBooks = filteredBooks.filter(b => b.title.toLowerCase().includes(keyword));

        const incompleteSection = document.getElementById('incomplete-section-title');
        const completeSection = document.getElementById('complete-section-title');

        if (currentFilter === 'completed') {
            filteredBooks = filteredBooks.filter(b => b.isComplete);
            incompleteBookList.style.display = 'none';
            incompleteSection.style.display = 'none';
            completeBookList.style.display = 'grid';
            completeSection.style.display = 'flex';
        } else if (currentFilter === 'incomplete') {
            filteredBooks = filteredBooks.filter(b => !b.isComplete);
            completeBookList.style.display = 'none';
            completeSection.style.display = 'none';
            incompleteBookList.style.display = 'grid';
            incompleteSection.style.display = 'flex';
        } else {
            incompleteBookList.style.display = 'grid';
            incompleteSection.style.display = 'flex';
            completeBookList.style.display = 'grid';
            completeSection.style.display = 'flex';
        }

        filteredBooks = applySort(filteredBooks);

        let incompleteCount = 0;
        let completeCount = 0;

        for (const book of filteredBooks) {
            const bookElement = createBookElement(book);
            if (book.isComplete) {
                completeBookList.appendChild(bookElement);
                completeCount++;
            } else {
                incompleteBookList.appendChild(bookElement);
                incompleteCount++;
            }
        }

        if (incompleteCount === 0 && (currentFilter === 'all' || currentFilter === 'incomplete')) showEmptyState(incompleteBookList, 'Belum selesai dibaca');
        if (completeCount === 0 && (currentFilter === 'all' || currentFilter === 'completed')) showEmptyState(completeBookList, 'Selesai dibaca');
    };

    const showEmptyState = (container, type) => {
        const icon = type === 'Selesai dibaca' ? 'fa-trophy' : 'fa-inbox';
        container.innerHTML = `<div class="empty-state"><i class="fas ${icon}"></i><p>Belum ada buku di rak ini.</p></div>`;
    };

    const animateAndExecute = (bookId, action) => {
        const bookElement = document.querySelector(`[data-bookid='${bookId}']`);
        if (bookElement) {
            bookElement.classList.add('removing');
            bookElement.addEventListener('animationend', action, { once: true });
        } else {
            action();
        }
    };

    const toggleBookStatus = (bookId) => {
        const book = books.find(b => b.id === bookId);
        if (!book) return;

        book.isComplete = !book.isComplete;
        
        saveBooks();
        showToast(`Buku "${book.title}" dipindahkan.`, 'success');
    };

    const toggleFavorite = (bookId, buttonElement) => {
        const book = books.find(b => b.id === bookId);
        if (!book) return;
        book.isFavorite = !book.isFavorite;
        const bookItem = buttonElement.closest('.book-item');
        if (book.isFavorite) {
            bookItem.classList.add('pulse');
            bookItem.addEventListener('animationend', () => bookItem.classList.remove('pulse'), { once: true });
        }
        saveBooks();
        showToast(book.isFavorite ? `"${book.title}" ditambahkan ke favorit!` : `"${book.title}" dihapus dari favorit.`, 'success');
    };

    const deleteBook = (bookId) => {
        const book = books.find(b => b.id === bookId);
        if (!book) return;

        books = books.filter(b => b.id !== bookId);

        saveBooks();
        showToast(`Buku "${book.title}" dihapus.`, 'success');
    };

    const showEditModal = (bookId) => {
        const book = books.find(b => b.id === bookId);
        if (!book) return;
        document.getElementById('editBookTitle').value = book.title;
        document.getElementById('editBookAuthor').value = book.author;
        document.getElementById('editBookYear').value = book.year;
        document.getElementById('editBookIsComplete').checked = book.isComplete;
        document.getElementById('editBookId').value = bookId;
        editModal.classList.add('active');
    };

    const hideModal = (modalElement) => modalElement.classList.remove('active');

    const showDeleteConfirmation = (bookId) => {
        currentBookIdToDelete = bookId;
        const book = books.find(b => b.id === bookId);
        document.getElementById('dialogMessage').textContent = `Apakah Anda yakin ingin menghapus "${book.title}"?`;
        confirmationDialog.classList.add('active');
    };

    const animateCountUp = (element, endValue) => {
        let startValue = parseInt(element.textContent, 10) || 0;
        if (startValue === endValue) return;
        const duration = 600;
        let startTime = null;
        const animation = (currentTime) => {
            if (startTime === null) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            const currentValue = Math.floor(progress * (endValue - startValue) + startValue);
            element.textContent = currentValue;
            if (progress < 1) requestAnimationFrame(animation);
        };
        requestAnimationFrame(animation);
    };

    const updateStats = () => {
        animateCountUp(document.getElementById('total-books'), books.length);
        animateCountUp(document.getElementById('incomplete-books'), books.filter(b => !b.isComplete).length);
        animateCountUp(document.getElementById('complete-books'), books.filter(b => b.isComplete).length);
        animateCountUp(document.getElementById('favorite-books'), books.filter(b => b.isFavorite).length);
    };

    const updateChartTheme = () => {
        const getCssVariable = (variable) => getComputedStyle(document.documentElement).getPropertyValue(variable).trim();

        const textColor = getCssVariable('--text-primary');
        const gridColor = getCssVariable('--border');

        Chart.defaults.color = textColor;
        Chart.defaults.borderColor = gridColor;
        
        if (booksPerYearChart) {
            booksPerYearChart.update();
        }
    };    
    
    const renderAnalyticsChart = () => {
        const ctx = document.getElementById('booksPerYearChart').getContext('2d');
        
        const getCssVariable = (variable) => getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
        const barBackgroundColor = getCssVariable('--accent-2') + '99';
        const barBorderColor = getCssVariable('--accent-2');

        const booksByYear = books.reduce((acc, book) => {
            const year = book.year;
            acc[year] = (acc[year] || 0) + 1;
            return acc;
        }, {});

        const sortedYears = Object.keys(booksByYear).sort((a, b) => a - b);
        const chartData = sortedYears.map(year => booksByYear[year]);

        if (booksPerYearChart) {
            booksPerYearChart.destroy();
        }

        booksPerYearChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedYears,
                datasets: [{
                    label: 'Jumlah Buku Ditambahkan',
                    data: chartData,
                    backgroundColor: barBackgroundColor,
                    borderColor: barBorderColor,
                    borderWidth: 1,
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
        updateChartTheme();
    }; 

    const showToast = (message, type = 'info') => {
        const toast = document.getElementById('toast');
        let icon = 'fas fa-info-circle';
        if (type === 'success') icon = 'fas fa-check-circle';
        if (type === 'error') icon = 'fas fa-exclamation-circle';
        toast.innerHTML = `<i class="${icon}"></i> ${message}`;
        toast.className = 'toast show';  
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    };
    
    const showNotesModal = (bookId) => {
        const book = books.find(b => b.id === bookId);
        if (!book) return;
        document.getElementById('notesBookTitle').textContent = book.title;
        document.getElementById('notesTextarea').value = book.notes || '';
        document.getElementById('notesBookId').value = bookId;
        notesModal.classList.add('active');
    };
    
    const updateClock = () => {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateString = now.toLocaleDateString('id-ID', options);
        const timeString = now.toLocaleTimeString('id-ID', { hour12: false });
        datetimeContainer.textContent = `${dateString} | ${timeString}`;
    };

    const triggerWelcomeAnimation = () => {
        const cards = document.querySelectorAll('.stat-card, .dashboard-grid .card, #analytics-card');
        cards.forEach((card, index) => {
            card.classList.add('animated-card');
            card.style.animationDelay = `${index * 100}ms`;
        });
    };

    bookForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newBook = {
            id: generateId(),
            title: document.getElementById("bookFormTitle").value.trim(),
            author: document.getElementById("bookFormAuthor").value.trim(),
            year: parseInt(document.getElementById("bookFormYear").value, 10) || new Date().getFullYear(),
            isComplete: document.getElementById("bookFormIsComplete").checked,
            isFavorite: false,
            notes: ''
        };
        books.push(newBook);
        saveBooks();
        bookForm.reset();
        showToast(`Buku "${newBook.title}" ditambahkan!`, 'success');
    });

    searchInput.addEventListener("input", renderBooks);
    document.getElementById("searchBook").addEventListener("submit", e => e.preventDefault());

    editBookForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const bookId = parseInt(document.getElementById('editBookId').value, 10);
        const book = books.find(b => b.id === bookId);
        if (!book) return;
        book.title = document.getElementById('editBookTitle').value.trim();
        book.author = document.getElementById('editBookAuthor').value.trim();
        book.year = parseInt(document.getElementById('editBookYear').value, 10) || book.year;
        book.isComplete = document.getElementById('editBookIsComplete').checked;
        saveBooks();
        hideModal(editModal);
        showToast('Buku berhasil diperbarui!', 'success');
    });

    dialogConfirmBtn.addEventListener('click', () => {
        if (currentBookIdToDelete) deleteBook(currentBookIdToDelete);
        hideModal(confirmationDialog);
    });
    
    const filterButtons = {
        'all': document.getElementById('filter-all'),
        'completed': document.getElementById('filter-completed'),
        'incomplete': document.getElementById('filter-incomplete')
    };
    
    Object.entries(filterButtons).forEach(([filter, button]) => {
        button.addEventListener('click', () => {
            currentFilter = filter;
            Object.values(filterButtons).forEach(btn => btn.style.opacity = "0.7");
            button.style.opacity = "1";
            renderBooks();
        });
    });
    filterButtons['all'].style.opacity = "1";

    closeModalBtn.addEventListener('click', () => hideModal(editModal));
    dialogCancelBtn.addEventListener('click', () => hideModal(confirmationDialog));
    window.addEventListener('click', (e) => {
        if (e.target === editModal) hideModal(editModal);
        if (e.target === confirmationDialog) hideModal(confirmationDialog);
        if (e.target === notesModal) hideModal(notesModal);
    });

    notesForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const bookId = parseInt(document.getElementById('notesBookId').value, 10);
        const book = books.find(b => b.id === bookId);
        if (!book) return;
        book.notes = document.getElementById('notesTextarea').value.trim();
        saveBooks();
        hideModal(notesModal);
        showToast('Catatan disimpan.', 'success');
    });

    sortSelect.addEventListener('change', renderBooks);

    const themeToggle = document.getElementById('themeToggle');
    const themeLabel = document.getElementById('theme-label');
    themeToggle.addEventListener('change', (e) => {
        document.body.classList.toggle('dark-mode', e.target.checked);
        themeLabel.textContent = e.target.checked ? 'Mode Terang' : 'Mode Gelap';
        localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
        updateChartTheme();
    });
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        themeToggle.checked = true;
        document.body.classList.add('dark-mode');
        themeLabel.textContent = 'Mode Terang';
    }

    const scrollToTopBtn = document.getElementById('scrollToTop');
    window.addEventListener('scroll', () => {
        scrollToTopBtn.style.display = (window.pageYOffset > 300) ? 'flex' : 'none';
    });
    scrollToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    document.querySelectorAll('.close-modal').forEach(el => {
        el.addEventListener('click', () => {
            el.closest('.modal, .confirmation-dialog').classList.remove('active');
        });
    });

    document.addEventListener("booksChanged", () => {
        renderBooks();
        updateStats();
        renderAnalyticsChart();  
    });

    triggerWelcomeAnimation();
    loadBooks();
    updateClock();
    setInterval(updateClock, 1000);

    VanillaTilt.init(document.querySelectorAll(".book-item"), {
        max: 15,     
        speed: 400,  
        glare: true,
        "max-glare": 0.5, 
    });    
});