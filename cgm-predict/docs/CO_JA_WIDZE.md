# CGM Predict — co ja widzę? (przewodnik po panelu)

Ten plik objaśnia elementy panelu CGM Predict. Dane pochodzą z Nightscout, ale panel pokazuje pomiary, statystyki i prognozy jako trzy różne rzeczy.

## Pomiar bieżący
- **Glukoza teraz**: najnowszy odczyt SGV z Nightscout. To pomiar, nie predykcja.
- **Czas pomiaru**: kiedy zapisano odczyt.
- **Trend / min**: nachylenie prostej dopasowanej do ostatnich 45 minut. Minus oznacza opadającą serię, plus rosnącą.
- **Wahania (SD)**: odchylenie standardowe odczytów w wybranym okresie. Opisuje rozrzut, nie kierunek.
- **Jakość danych**: prosty wskaźnik ciągłości odczytów, nie medyczna ocena sensora.

## Wykres glukozy
Turkusowa linia to historyczne odczyty SGV. Przyciski wybierają 6 h, 12 h, 24 h, 3 dni lub 7 dni. Linie przerywane oznaczają progi 70 i 180 mg/dL. To nie są prognozy.

## Prognoza krótkoterminowa
Kafelki pokazują szacunek za 15, 30, 45 i 60 minut. Turkusowa linia to estymata trendu; linie kropkowane wyznaczają prosty przedział niepewności oparty o reszty regresji. Model używa ostatnich 45 minut i nie jest wytrenowanym ML ani modelem farmakodynamicznym.

## Statystyki 7 / 30 / 90 dni
Przyciski zmieniają okres statystyk, profilu dobowego, rozkładu zakresów i jakości danych.
- **Średnia**: średnia arytmetyczna odczytów.
- **TIR 70–180**: procent odczytów w tym zakresie.
- **Poniżej 70 / Powyżej 180**: procent odczytów poza zakresem.
- **Mediana**: środkowa wartość po uporządkowaniu danych.
- **Minimum / Maksimum**: najniższy / najwyższy odczyt.
- **Odczyty**: liczba punktów użytych do obliczeń.
- **SD**: miara rozrzutu wartości.

Obecny TIR jest udziałem liczby odczytów, nie dokładną rekonstrukcją czasu w zakresie.

## Profil dobowy
Każdy słupek to średnia z odczytów przypadających na daną lokalną godzinę, w wybranym okresie. Może ujawnić powtarzające się pory wyższych lub niższych odczytów, ale nie wyjaśnia przyczyny.

## Zakresy glukozy
Pierścień dzieli odczyty na poniżej 70, 70–180 i powyżej 180 mg/dL. To wizualizacja tych samych procentów co w statystykach.

## Jakość i ciągłość danych
- **Ostatni pomiar**: minuty od najnowszego odczytu.
- **Mediana odstępu**: typowy czas między kolejnymi odczytami.
- **Długie przerwy >15 min**: liczba odstępów dłuższych niż 15 minut w wybranym okresie; nie liczba utraconych próbek.
- **Pokrycie ≤10 min**: procent odstępów nie dłuższych niż 10 minut.

## Porównanie okresów
Porównuje średnią (mg/dL) i TIR (%) z ostatnich 7, 30 i 90 dni. Są dwie osie pionowe. Porównuj średnią z innymi średnimi, a TIR z innymi wartościami TIR.

## Zdarzenia Nightscout
Lista czyta kolekcję `treatments`, np. dawki insuliny, węglowodany, typ zdarzenia, notatkę i źródło wpisu. Pokazuje wyłącznie pola rzeczywiście obecne w rekordzie.

## Podobne epizody historyczne
System szuka starszych sekwencji sześciu odczytów podobnych do aktualnej sekwencji i opisuje późniejszy fragment tych epizodów. To heurystyka, nie wytrenowany model ML ani indywidualne prawdopodobieństwo kliniczne.

## Co widać na przesłanych zrzutach 0.2?
Na moment wykonania zrzutów widoczne było około 166–168 mg/dL. Trend około -0,03 do -0,06 mg/dL/min oznaczał prawie płaską, lekko opadającą serię w poprzednich 45 minutach. Prognoza za 60 minut około 162–166 mg/dL była ekstrapolacją tego krótkiego trendu.

Statystyki pokazywały średnią 180, medianę 177, minimum 45, maksimum 375, TIR 51%, poniżej 70: 2%, powyżej 180: 47% oraz 23 739 odczytów w ówczesnym okresie 30 dni. Był to historyczny podgląd, nie bieżący wynik. Wartość 141 długich przerw w poprzedniej wersji była liczbą odstępów ponad 15 minut w jej badanym zakresie, nie liczbą brakujących pomiarów. 20 podobnych próbek to 20 historycznych fragmentów dopasowanych heurystycznie.

## Ograniczenia
Nie ma jeszcze trenowanego ML, IOB/COB, indywidualnego profilu farmakodynamicznego, walk-forward backtestu ani walidacji klinicznej. Prognozy mogą być błędne. Nie używaj panelu do obliczania dawek insuliny ani do odkładania reakcji na alarmy CGM i ustalony plan postępowania.
