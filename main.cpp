/*
 * JeevanRoute - Rural Emergency Response System (OOP version)
 *
 * OOP concepts used (quick map for viva):
 *   Encapsulation : every data member is private; changes go through validated setters.
 *   Inheritance   : Person -> Patient,  Resource -> Ambulance -> Basic/AdvancedAmbulance,
 *                   Resource -> Hospital.
 *   Abstraction   : Resource and Ambulance are abstract (pure virtual functions);
 *                   EmergencyManager hides the whole workflow behind run().
 *   Polymorphism  : canHandle(), display() and typeLabel() are virtual and are
 *                   overridden differently by each subclass.
 *
 * Data structures (all hand-written):
 *   Linked list    -> PatientList
 *   Max-heap       -> EmergencyQueue (priority queue: severity first, then arrival order)
 *   Linked stack   -> DispatchHistory
 *   Adjacency list -> RoadMap (graph), searched with BFS and DFS (no Dijkstra)
 *
 * This is decision-support demo software with sample data. It is not a real
 * medical or dispatch system.
 */

#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
#include <stdexcept>
#include <cstdlib>
#include <cerrno>
using namespace std;

// =====================================================================
//  Constants and small helpers
// =====================================================================
const int NUM_LOCATIONS = 10;
const char *const LOCATION_NAMES[NUM_LOCATIONS] = {
    "Village A", "Village B", "Village C", "Village D", "Village E",
    "City Center", "Rural Area", "Main Road", "Village Road", "District Center"};

enum LocationIndex
{
    VILLAGE_A, VILLAGE_B, VILLAGE_C, VILLAGE_D, VILLAGE_E,
    CITY_CENTER, RURAL_AREA, MAIN_ROAD, VILLAGE_ROAD, DISTRICT_CENTER
};

enum Severity { STABLE = 1, SERIOUS = 2, CRITICAL = 3 };
enum PatientStatus { REGISTERED, WAITING, DISPATCHED };

string locationName(int index)
{
    return LOCATION_NAMES[index];
}

string severityName(Severity s)
{
    switch (s)
    {
    case CRITICAL: return "CRITICAL";
    case SERIOUS:  return "SERIOUS";
    default:       return "STABLE";
    }
}

void printLocations()
{
    cout << "\nLocations:\n";
    for (int i = 0; i < NUM_LOCATIONS; i++)
        cout << "  " << (i + 1) << ". " << LOCATION_NAMES[i] << "\n";
}

// ---------------------------------------------------------------------
//  Input: every read is validated, so bad typing never breaks the program
// ---------------------------------------------------------------------
class Input
{
public:
    static string readLine(const string &prompt)
    {
        string s;
        while (true)
        {
            cout << prompt;
            if (!getline(cin, s))
            {
                cout << "\nInput closed. Exiting.\n";
                exit(0);
            }
            size_t a = s.find_first_not_of(" \t\r\n");
            size_t b = s.find_last_not_of(" \t\r\n");
            if (a == string::npos)
            {
                cout << "Input cannot be empty.\n";
                continue;
            }
            return s.substr(a, b - a + 1);
        }
    }

    static int readInt(const string &prompt, int lo, int hi)
    {
        while (true)
        {
            string s = readLine(prompt);
            char *end = nullptr;
            errno = 0;
            long v = strtol(s.c_str(), &end, 10);
            if (*end != '\0' || errno != 0 || v < lo || v > hi)
            {
                cout << "Please enter a whole number between " << lo << " and " << hi << ".\n";
                continue;
            }
            return (int)v;
        }
    }

    static bool readYesNo(const string &prompt)
    {
        while (true)
        {
            string s = readLine(prompt + " (y/n): ");
            if (s == "y" || s == "Y") return true;
            if (s == "n" || s == "N") return false;
            cout << "Please type y or n.\n";
        }
    }
};

// =====================================================================
//  Capabilities: what a patient NEEDS / what a hospital OFFERS
// =====================================================================
class Capabilities
{
private:
    bool oxygen, ventilator, icu, surgeon;

public:
    Capabilities(bool o = false, bool v = false, bool i = false, bool s = false)
        : oxygen(o), ventilator(v), icu(i), surgeon(s) {}

    bool hasOxygen() const { return oxygen; }
    bool hasVentilator() const { return ventilator; }
    bool hasIcu() const { return icu; }
    bool hasSurgeon() const { return surgeon; }

    // True when this set of capabilities satisfies every item in 'need'
    bool covers(const Capabilities &need) const
    {
        return (!need.oxygen || oxygen) && (!need.ventilator || ventilator) &&
               (!need.icu || icu) && (!need.surgeon || surgeon);
    }

    // How many of the needed items are available here (used for partial matches)
    int matchCount(const Capabilities &need) const
    {
        int n = 0;
        if (need.oxygen && oxygen) n++;
        if (need.ventilator && ventilator) n++;
        if (need.icu && icu) n++;
        if (need.surgeon && surgeon) n++;
        return n;
    }

    string missingFrom(const Capabilities &need) const
    {
        string s;
        if (need.oxygen && !oxygen) s += "Oxygen, ";
        if (need.ventilator && !ventilator) s += "Ventilator, ";
        if (need.icu && !icu) s += "ICU, ";
        if (need.surgeon && !surgeon) s += "Surgeon, ";
        if (!s.empty()) s.erase(s.size() - 2);
        return s;
    }

    string describe() const
    {
        string s;
        if (oxygen) s += "Oxygen, ";
        if (ventilator) s += "Ventilator, ";
        if (icu) s += "ICU, ";
        if (surgeon) s += "Surgeon, ";
        if (s.empty()) return "None";
        s.erase(s.size() - 2);
        return s;
    }
};

// =====================================================================
//  Person -> Patient   (inheritance + encapsulation)
// =====================================================================
class Person
{
private:
    int id;
    string name;
    int age;

public:
    Person(int id, const string &name, int age)
    {
        setId(id);
        setName(name);
        setAge(age);
    }
    virtual ~Person() {}

    int getId() const { return id; }
    string getName() const { return name; }
    int getAge() const { return age; }

    void setId(int v)
    {
        if (v <= 0) throw invalid_argument("Patient ID must be a positive number.");
        id = v;
    }
    void setName(const string &n)
    {
        if (n.empty() || n.size() > 50) throw invalid_argument("Name must be 1 to 50 characters.");
        name = n;
    }
    void setAge(int a)
    {
        if (a < 0 || a > 120) throw invalid_argument("Age must be between 0 and 120.");
        age = a;
    }

    virtual void display() const
    {
        cout << "ID         : " << id << "\n";
        cout << "Name       : " << name << "\n";
        cout << "Age        : " << age << "\n";
    }
};

class Patient : public Person
{
private:
    int locationIndex;
    Severity severity;
    Capabilities required;
    PatientStatus status;
    Patient *next; // link used by PatientList

public:
    Patient(int id, const string &name, int age, int location)
        : Person(id, name, age), locationIndex(0), severity(STABLE),
          status(REGISTERED), next(nullptr)
    {
        setLocation(location);
    }

    int getLocation() const { return locationIndex; }
    Severity getSeverity() const { return severity; }
    const Capabilities &getRequired() const { return required; }
    PatientStatus getStatus() const { return status; }
    Patient *getNext() const { return next; }

    void setLocation(int l)
    {
        if (l < 0 || l >= NUM_LOCATIONS) throw invalid_argument("Invalid location.");
        locationIndex = l;
    }
    void setSeverity(Severity s) { severity = s; }
    void setRequired(const Capabilities &c) { required = c; }
    void setStatus(PatientStatus s) { status = s; }
    void setNext(Patient *n) { next = n; }

    void display() const override
    {
        Person::display();
        cout << "Location   : " << locationName(locationIndex) << "\n";
        switch (status)
        {
        case REGISTERED: cout << "Status     : Registered\n"; break;
        case WAITING:    cout << "Status     : Waiting in emergency queue\n"; break;
        case DISPATCHED: cout << "Status     : Ambulance dispatched\n"; break;
        }
        if (status != REGISTERED)
        {
            cout << "Severity   : " << severityName(severity) << "\n";
            cout << "Needs      : " << required.describe() << "\n";
        }
    }
};

// =====================================================================
//  Resource (abstract) -> Ambulance (abstract) -> Basic / Advanced
//                      -> Hospital
// =====================================================================
class Resource
{
private:
    int id;
    string name;
    int locationIndex;

public:
    Resource(int id, const string &name, int location)
        : id(id), name(name), locationIndex(location) {}
    virtual ~Resource() {}

    int getId() const { return id; }
    string getName() const { return name; }
    int getLocation() const { return locationIndex; }

    // Pure virtual: every concrete resource decides for itself
    virtual bool canHandle(const Patient &p) const = 0;
    virtual string typeLabel() const = 0;
    virtual void display() const = 0;
};

class Ambulance : public Resource
{
private:
    bool available;
    int assignedPatientId; // 0 = none

public:
    Ambulance(int id, int location, bool available)
        : Resource(id, "AMB-" + to_string(id), location),
          available(available), assignedPatientId(0) {}

    bool isAvailable() const { return available; }
    int getAssignedPatientId() const { return assignedPatientId; }
    void setAvailable(bool a) { available = a; }
    void assignPatient(int patientId) { assignedPatientId = patientId; }

    void display() const override
    {
        cout << "Ambulance  : " << getName() << "\n";
        cout << "Type       : " << typeLabel() << "\n";
        cout << "Base       : " << locationName(getLocation()) << "\n";
        cout << "Status     : " << (available ? "AVAILABLE" : "BUSY") << "\n";
        if (!available && assignedPatientId != 0)
            cout << "Patient    : ID " << assignedPatientId << "\n";
    }
};

class BasicAmbulance : public Ambulance
{
public:
    BasicAmbulance(int id, int location, bool available) : Ambulance(id, location, available) {}

    // Basic life support: oxygen only, cannot carry critical or ventilator patients
    bool canHandle(const Patient &p) const override
    {
        return !p.getRequired().hasVentilator() && p.getSeverity() != CRITICAL;
    }
    string typeLabel() const override { return "Basic Life Support"; }
};

class AdvancedAmbulance : public Ambulance
{
public:
    AdvancedAmbulance(int id, int location, bool available) : Ambulance(id, location, available) {}

    // Advanced life support: ventilator on board, can carry any patient
    bool canHandle(const Patient &) const override { return true; }
    string typeLabel() const override { return "Advanced Life Support (ventilator on board)"; }
};

class Hospital : public Resource
{
private:
    Capabilities offered;

public:
    Hospital(int id, const string &name, int location, const Capabilities &offered)
        : Resource(id, name, location), offered(offered) {}

    const Capabilities &getOffered() const { return offered; }

    bool canHandle(const Patient &p) const override { return offered.covers(p.getRequired()); }
    int matchCount(const Patient &p) const { return offered.matchCount(p.getRequired()); }
    string missingFor(const Patient &p) const { return offered.missingFrom(p.getRequired()); }
    string typeLabel() const override { return "Hospital"; }

    void display() const override
    {
        cout << "Hospital ID: " << getId() << "\n";
        cout << "Name       : " << getName() << "\n";
        cout << "Location   : " << locationName(getLocation()) << "\n";
        cout << "Oxygen     : " << (offered.hasOxygen() ? "Available" : "Not available") << "\n";
        cout << "Ventilator : " << (offered.hasVentilator() ? "Available" : "Not available") << "\n";
        cout << "ICU        : " << (offered.hasIcu() ? "Available" : "Not available") << "\n";
        cout << "Surgeon    : " << (offered.hasSurgeon() ? "Available" : "Not available") << "\n";
    }
};

// =====================================================================
//  RoadMap: graph as adjacency list, searched with BFS and DFS
// =====================================================================
struct Edge
{
    int to;
    int km;
    bool blocked;
    Edge *next;
};

struct Route
{
    int nodes[NUM_LOCATIONS];
    int length; // number of locations on the route
    int km;
    Route() : length(0), km(0) {}
};

class RoadMap
{
private:
    Edge *adj[NUM_LOCATIONS];

    void addDirected(int a, int b, int km)
    {
        Edge *e = new Edge{b, km, false, adj[a]};
        adj[a] = e;
    }

    Edge *findEdge(int a, int b) const
    {
        for (Edge *e = adj[a]; e != nullptr; e = e->next)
            if (e->to == b) return e;
        return nullptr;
    }

    // DFS with backtracking: collects every simple route from cur to dest
    void dfs(int cur, int dest, bool visited[], Route &path, vector<Route> &out) const
    {
        visited[cur] = true;
        path.nodes[path.length++] = cur;

        if (cur == dest)
        {
            out.push_back(path);
        }
        else
        {
            for (Edge *e = adj[cur]; e != nullptr; e = e->next)
            {
                if (e->blocked || visited[e->to]) continue;
                path.km += e->km;
                dfs(e->to, dest, visited, path, out);
                path.km -= e->km;
            }
        }

        path.length--;
        visited[cur] = false; // backtrack
    }

public:
    RoadMap()
    {
        for (int i = 0; i < NUM_LOCATIONS; i++) adj[i] = nullptr;
    }
    ~RoadMap()
    {
        for (int i = 0; i < NUM_LOCATIONS; i++)
        {
            Edge *e = adj[i];
            while (e != nullptr)
            {
                Edge *next = e->next;
                delete e;
                e = next;
            }
        }
    }
    RoadMap(const RoadMap &) = delete;
    RoadMap &operator=(const RoadMap &) = delete;

    void addRoad(int a, int b, int km)
    {
        addDirected(a, b, km);
        addDirected(b, a, km);
    }

    bool roadExists(int a, int b) const { return findEdge(a, b) != nullptr; }

    bool isBlocked(int a, int b) const
    {
        Edge *e = findEdge(a, b);
        return e != nullptr && e->blocked;
    }

    // Blocks or reopens a road (both directions). Returns false if no such road.
    bool setBlocked(int a, int b, bool blocked)
    {
        Edge *e1 = findEdge(a, b);
        Edge *e2 = findEdge(b, a);
        if (e1 == nullptr || e2 == nullptr) return false;
        e1->blocked = blocked;
        e2->blocked = blocked;
        return true;
    }

    // BFS: route with the fewest road segments. Also tells us if a place is reachable.
    bool bfsFewestStops(int start, int dest, Route &result) const
    {
        int parent[NUM_LOCATIONS];
        bool visited[NUM_LOCATIONS];
        int q[NUM_LOCATIONS];
        int front = 0, rear = 0;

        for (int i = 0; i < NUM_LOCATIONS; i++)
        {
            parent[i] = -1;
            visited[i] = false;
        }

        visited[start] = true;
        q[rear++] = start;

        while (front < rear)
        {
            int cur = q[front++];
            if (cur == dest) break;
            for (Edge *e = adj[cur]; e != nullptr; e = e->next)
            {
                if (e->blocked || visited[e->to]) continue;
                visited[e->to] = true;
                parent[e->to] = cur;
                q[rear++] = e->to;
            }
        }

        if (!visited[dest]) return false;

        // Rebuild the path from dest back to start
        int tmp[NUM_LOCATIONS];
        int count = 0;
        for (int v = dest; v != -1; v = parent[v]) tmp[count++] = v;

        result = Route();
        for (int i = count - 1; i >= 0; i--)
        {
            result.nodes[result.length++] = tmp[i];
            if (i < count - 1) result.km += findEdge(tmp[i + 1], tmp[i])->km;
        }
        return true;
    }

    // DFS: every open route, sorted from shortest to longest (km)
    bool dfsAllRoutes(int start, int dest, vector<Route> &routes) const
    {
        routes.clear();
        bool visited[NUM_LOCATIONS];
        for (int i = 0; i < NUM_LOCATIONS; i++) visited[i] = false;
        Route path;
        dfs(start, dest, visited, path, routes);
        sort(routes.begin(), routes.end(), [](const Route &a, const Route &b) {
            if (a.km != b.km) return a.km < b.km;
            return a.length < b.length;
        });
        return !routes.empty();
    }

    bool shortestByDfs(int start, int dest, Route &best) const
    {
        vector<Route> routes;
        if (!dfsAllRoutes(start, dest, routes)) return false;
        best = routes[0];
        return true;
    }

    static string routeToString(const Route &r)
    {
        string s;
        for (int i = 0; i < r.length; i++)
        {
            if (i > 0) s += " -> ";
            s += locationName(r.nodes[i]);
        }
        return s + " (" + to_string(r.km) + " km)";
    }

    void display() const
    {
        cout << "\n========== ROAD MAP (adjacency list) ==========\n";
        for (int i = 0; i < NUM_LOCATIONS; i++)
        {
            cout << locationName(i) << " :";
            for (Edge *e = adj[i]; e != nullptr; e = e->next)
            {
                cout << "  " << locationName(e->to) << " (" << e->km << " km)";
                if (e->blocked) cout << " [BLOCKED]";
            }
            cout << "\n";
        }
    }
};

// =====================================================================
//  PatientList: singly linked list (owns its Patient objects)
// =====================================================================
class PatientList
{
private:
    Patient *head;
    Patient *tail;
    int count;

public:
    PatientList() : head(nullptr), tail(nullptr), count(0) {}
    ~PatientList()
    {
        Patient *cur = head;
        while (cur != nullptr)
        {
            Patient *next = cur->getNext();
            delete cur;
            cur = next;
        }
    }
    PatientList(const PatientList &) = delete;
    PatientList &operator=(const PatientList &) = delete;

    Patient *find(int id) const
    {
        for (Patient *p = head; p != nullptr; p = p->getNext())
            if (p->getId() == id) return p;
        return nullptr;
    }

    // Takes ownership. Returns false (and does nothing) if the ID already exists.
    bool add(Patient *p)
    {
        if (find(p->getId()) != nullptr) return false;
        if (head == nullptr) head = tail = p;
        else
        {
            tail->setNext(p);
            tail = p;
        }
        count++;
        return true;
    }

    int size() const { return count; }

    void display() const
    {
        if (head == nullptr)
        {
            cout << "\nNo patients registered.\n";
            return;
        }
        cout << "\n========== PATIENT LIST (" << count << ") ==========\n";
        for (Patient *p = head; p != nullptr; p = p->getNext())
        {
            p->display();
            cout << "---------------------------------\n";
        }
    }
};

// =====================================================================
//  EmergencyQueue: max-heap priority queue
//  Higher severity first; equal severity -> earlier arrival first
// =====================================================================
class EmergencyQueue
{
private:
    struct Entry
    {
        Patient *patient; // not owned
        int seq;          // arrival order
    };

    static const int CAPACITY = 50;
    Entry heap[CAPACITY];
    int count;
    int nextSeq;

    static bool higher(const Entry &a, const Entry &b)
    {
        if (a.patient->getSeverity() != b.patient->getSeverity())
            return a.patient->getSeverity() > b.patient->getSeverity();
        return a.seq < b.seq;
    }

    void siftUp(int i)
    {
        while (i > 0)
        {
            int parent = (i - 1) / 2;
            if (!higher(heap[i], heap[parent])) break;
            swap(heap[i], heap[parent]);
            i = parent;
        }
    }

    void siftDown(int i)
    {
        while (true)
        {
            int l = 2 * i + 1, r = 2 * i + 2, best = i;
            if (l < count && higher(heap[l], heap[best])) best = l;
            if (r < count && higher(heap[r], heap[best])) best = r;
            if (best == i) break;
            swap(heap[i], heap[best]);
            i = best;
        }
    }

public:
    EmergencyQueue() : count(0), nextSeq(1) {}

    bool isEmpty() const { return count == 0; }
    bool isFull() const { return count == CAPACITY; }
    int size() const { return count; }

    bool push(Patient *p)
    {
        if (isFull()) return false;
        heap[count].patient = p;
        heap[count].seq = nextSeq++;
        siftUp(count);
        count++;
        return true;
    }

    Patient *peek() const { return count == 0 ? nullptr : heap[0].patient; }

    Patient *pop()
    {
        if (count == 0) return nullptr;
        Patient *top = heap[0].patient;
        count--;
        heap[0] = heap[count];
        siftDown(0);
        return top;
    }

    void display() const
    {
        if (isEmpty())
        {
            cout << "\nEmergency queue is empty.\n";
            return;
        }
        cout << "\n========== EMERGENCY QUEUE (" << count << " waiting) ==========\n";
        EmergencyQueue copy(*this); // pop from a copy so the real queue is untouched
        int position = 1;
        while (!copy.isEmpty())
        {
            Patient *p = copy.pop();
            cout << "#" << position++ << "  " << severityName(p->getSeverity())
                 << "  | ID " << p->getId() << " | " << p->getName()
                 << " | " << locationName(p->getLocation())
                 << " | Needs: " << p->getRequired().describe() << "\n";
        }
    }
};

// =====================================================================
//  DispatchHistory: linked stack (latest dispatch on top, no size limit)
// =====================================================================
struct DispatchRecord
{
    int patientId;
    string patientName;
    Severity severity;
    string ambulanceName;
    string ambulanceType;
    string hospitalName;
    string ambulanceRoute;
    string hospitalRoute;
    string warning; // empty when the hospital met every requirement
    DispatchRecord *next;
};

class DispatchHistory
{
private:
    DispatchRecord *top;
    int count;

public:
    DispatchHistory() : top(nullptr), count(0) {}
    ~DispatchHistory()
    {
        while (top != nullptr)
        {
            DispatchRecord *next = top->next;
            delete top;
            top = next;
        }
    }
    DispatchHistory(const DispatchHistory &) = delete;
    DispatchHistory &operator=(const DispatchHistory &) = delete;

    void push(const DispatchRecord &record)
    {
        DispatchRecord *node = new DispatchRecord(record);
        node->next = top;
        top = node;
        count++;
    }

    void display() const
    {
        if (top == nullptr)
        {
            cout << "\nNo dispatches yet.\n";
            return;
        }
        cout << "\n========== DISPATCH HISTORY (latest first, " << count << " total) ==========\n";
        for (DispatchRecord *r = top; r != nullptr; r = r->next)
        {
            cout << "Patient    : " << r->patientName << " (ID " << r->patientId << ", "
                 << severityName(r->severity) << ")\n";
            cout << "Ambulance  : " << r->ambulanceName << " - " << r->ambulanceType << "\n";
            cout << "Hospital   : " << r->hospitalName << "\n";
            cout << "To patient : " << r->ambulanceRoute << "\n";
            cout << "To hospital: " << r->hospitalRoute << "\n";
            if (!r->warning.empty()) cout << "Warning    : hospital is missing " << r->warning << "\n";
            cout << "---------------------------------\n";
        }
    }
};

// =====================================================================
//  EmergencyManager: coordinates the whole workflow (abstraction)
// =====================================================================
class EmergencyManager
{
private:
    static const int NUM_AMBULANCES = 5;
    static const int NUM_HOSPITALS = 5;

    PatientList patients;
    EmergencyQueue queue;
    DispatchHistory history;
    RoadMap map;
    Ambulance *fleet[NUM_AMBULANCES];
    Hospital *hospitals[NUM_HOSPITALS];

    // ---------- setup ----------
    void buildMap()
    {
        map.addRoad(VILLAGE_A, VILLAGE_B, 4);
        map.addRoad(VILLAGE_A, VILLAGE_C, 7);
        map.addRoad(VILLAGE_B, VILLAGE_D, 5);
        map.addRoad(VILLAGE_B, CITY_CENTER, 8);
        map.addRoad(VILLAGE_C, VILLAGE_E, 3);
        map.addRoad(VILLAGE_C, RURAL_AREA, 6);
        map.addRoad(VILLAGE_D, MAIN_ROAD, 4);
        map.addRoad(VILLAGE_D, VILLAGE_ROAD, 7);
        map.addRoad(VILLAGE_E, VILLAGE_ROAD, 5);
        map.addRoad(CITY_CENTER, MAIN_ROAD, 3);
        map.addRoad(CITY_CENTER, DISTRICT_CENTER, 6);
        map.addRoad(RURAL_AREA, VILLAGE_ROAD, 4);
        map.addRoad(MAIN_ROAD, DISTRICT_CENTER, 5);
        map.addRoad(VILLAGE_ROAD, DISTRICT_CENTER, 4);
        map.addRoad(RURAL_AREA, DISTRICT_CENTER, 8);
    }

    void buildFleet()
    {
        // Polymorphism: the array holds Ambulance*, objects are different subclasses
        fleet[0] = new BasicAmbulance(1, VILLAGE_A, true);
        fleet[1] = new AdvancedAmbulance(2, VILLAGE_B, true);
        fleet[2] = new BasicAmbulance(3, VILLAGE_C, false);
        fleet[3] = new AdvancedAmbulance(4, VILLAGE_D, true);
        fleet[4] = new BasicAmbulance(5, VILLAGE_E, false);
    }

    void buildHospitals()
    {
        //                                              oxygen ventil. icu    surgeon
        hospitals[0] = new Hospital(1, "City Hospital", CITY_CENTER, Capabilities(true, true, true, true));
        hospitals[1] = new Hospital(2, "Rural Care Hospital", RURAL_AREA, Capabilities(true, false, false, false));
        hospitals[2] = new Hospital(3, "Emergency Care Hospital", MAIN_ROAD, Capabilities(true, true, true, false));
        hospitals[3] = new Hospital(4, "Community Hospital", VILLAGE_ROAD, Capabilities(false, false, false, false));
        hospitals[4] = new Hospital(5, "District Hospital", DISTRICT_CENTER, Capabilities(true, false, true, true));
    }

    // ---------- route reporting (DFS + BFS) ----------
    void showRouteReport(int from, int to) const
    {
        vector<Route> routes;
        if (!map.dfsAllRoutes(from, to, routes))
        {
            cout << "    No open route between " << locationName(from) << " and " << locationName(to) << ".\n";
            return;
        }
        cout << "    Shortest route (DFS, " << routes.size() << " route(s) checked): "
             << RoadMap::routeToString(routes[0]) << "\n";
        if (routes.size() > 1)
            cout << "    Alternate route (DFS)  : " << RoadMap::routeToString(routes[1]) << "\n";
        Route fewest;
        if (map.bfsFewestStops(from, to, fewest) && fewest.length < routes[0].length)
            cout << "    Fewest stops (BFS)     : " << RoadMap::routeToString(fewest) << "\n";
    }

    // ---------- selection logic ----------
    Ambulance *chooseAmbulance(const Patient &p, Route &bestRoute, string &reason) const
    {
        Ambulance *best = nullptr;
        int availableCount = 0, capableCount = 0;

        for (int i = 0; i < NUM_AMBULANCES; i++)
        {
            Ambulance *a = fleet[i];
            if (!a->isAvailable()) continue;
            availableCount++;
            if (!a->canHandle(p)) continue; // virtual call: Basic and Advanced answer differently
            capableCount++;

            Route r;
            if (!map.shortestByDfs(a->getLocation(), p.getLocation(), r)) continue;
            if (best == nullptr || r.km < bestRoute.km)
            {
                best = a;
                bestRoute = r;
            }
        }

        if (best == nullptr)
        {
            if (availableCount == 0)
                reason = "All ambulances are currently busy.";
            else if (capableCount == 0)
                reason = "No available ambulance can carry this patient "
                         "(basic units cannot take critical or ventilator patients).";
            else
                reason = "No available ambulance can reach the patient (roads blocked).";
        }
        return best;
    }

    // First choice: a hospital that meets EVERY requirement. Otherwise the closest partial match.
    Hospital *chooseHospital(const Patient &p, Route &bestRoute, bool &fullMatch) const
    {
        Hospital *best = nullptr;
        for (int i = 0; i < NUM_HOSPITALS; i++)
        {
            Hospital *h = hospitals[i];
            if (!h->canHandle(p)) continue;
            Route r;
            if (!map.shortestByDfs(p.getLocation(), h->getLocation(), r)) continue;
            if (best == nullptr || r.km < bestRoute.km)
            {
                best = h;
                bestRoute = r;
            }
        }
        if (best != nullptr)
        {
            fullMatch = true;
            return best;
        }

        fullMatch = false;
        int bestScore = -1;
        for (int i = 0; i < NUM_HOSPITALS; i++)
        {
            Hospital *h = hospitals[i];
            Route r;
            if (!map.shortestByDfs(p.getLocation(), h->getLocation(), r)) continue;
            int score = h->matchCount(p);
            if (score > bestScore || (score == bestScore && r.km < bestRoute.km))
            {
                best = h;
                bestScore = score;
                bestRoute = r;
            }
        }
        return best;
    }

public:
    EmergencyManager()
    {
        buildMap();
        buildFleet();
        buildHospitals();
    }
    ~EmergencyManager()
    {
        for (int i = 0; i < NUM_AMBULANCES; i++) delete fleet[i];
        for (int i = 0; i < NUM_HOSPITALS; i++) delete hospitals[i];
    }
    EmergencyManager(const EmergencyManager &) = delete;
    EmergencyManager &operator=(const EmergencyManager &) = delete;

    // ---------- menu actions ----------
    void registerPatient()
    {
        int id = Input::readInt("\nEnter Patient ID: ", 1, 999999);
        if (patients.find(id) != nullptr)
        {
            cout << "A patient with this ID already exists.\n";
            return;
        }
        string name = Input::readLine("Enter Patient Name: ");
        int age = Input::readInt("Enter Age (0-120): ", 0, 120);
        printLocations();
        int loc = Input::readInt("Select location number: ", 1, NUM_LOCATIONS) - 1;

        try
        {
            patients.add(new Patient(id, name, age, loc));
            cout << "\nPatient registered successfully!\n";
        }
        catch (const invalid_argument &e)
        {
            cout << "\nCould not register patient: " << e.what() << "\n";
        }
    }

    void reportEmergency()
    {
        int id = Input::readInt("\nEnter Patient ID: ", 1, 999999);
        Patient *p = patients.find(id);
        if (p == nullptr)
        {
            cout << "\nPatient not found!\n";
            return;
        }
        if (p->getStatus() == WAITING)
        {
            cout << "\nThis patient is already waiting in the emergency queue.\n";
            return;
        }
        if (p->getStatus() == DISPATCHED)
        {
            cout << "\nThis patient already has an ambulance on the way. "
                    "Mark the ambulance available first.\n";
            return;
        }
        if (queue.isFull())
        {
            cout << "\nEmergency queue is full!\n";
            return;
        }

        cout << "\nSeverity:  1 = Stable   2 = Serious   3 = Critical\n";
        int sev = Input::readInt("Enter severity (1-3): ", 1, 3);
        bool oxygen = Input::readYesNo("Needs oxygen?");
        bool ventilator = Input::readYesNo("Needs ventilator?");
        bool icu = Input::readYesNo("Needs ICU?");
        bool surgeon = Input::readYesNo("Needs surgeon?");

        p->setSeverity((Severity)sev);
        p->setRequired(Capabilities(oxygen, ventilator, icu, surgeon));
        p->setStatus(WAITING);
        queue.push(p);
        cout << "\nEmergency request added successfully! (" << severityName(p->getSeverity()) << ")\n";
    }

    void processEmergency()
    {
        Patient *p = queue.peek();
        if (p == nullptr)
        {
            cout << "\nNo emergency requests available.\n";
            return;
        }

        cout << "\n========== PROCESSING EMERGENCY ==========\n";
        p->display();

        Route ambRoute;
        string reason;
        Ambulance *amb = chooseAmbulance(*p, ambRoute, reason);
        if (amb == nullptr)
        {
            cout << "\n" << reason << "\nThe patient keeps their place at the front of the queue.\n";
            return;
        }

        Route hospRoute;
        bool fullMatch = false;
        Hospital *hosp = chooseHospital(*p, hospRoute, fullMatch);
        if (hosp == nullptr)
        {
            cout << "\nNo reachable hospital found (roads blocked).\n"
                    "The patient keeps their place at the front of the queue.\n";
            return;
        }

        string warning;
        if (!fullMatch)
        {
            warning = hosp->missingFor(*p);
            cout << "\nWARNING: no hospital meets every requirement.\n"
                 << "Closest partial match: " << hosp->getName()
                 << " (missing: " << warning << ")\n";
            if (!Input::readYesNo("Dispatch to this hospital anyway?"))
            {
                cout << "Dispatch cancelled. The patient keeps their place at the front of the queue.\n";
                return;
            }
        }

        // Everything succeeded: now (and only now) change the system state
        queue.pop();
        amb->setAvailable(false);
        amb->assignPatient(p->getId());
        p->setStatus(DISPATCHED);

        DispatchRecord rec;
        rec.patientId = p->getId();
        rec.patientName = p->getName();
        rec.severity = p->getSeverity();
        rec.ambulanceName = amb->getName();
        rec.ambulanceType = amb->typeLabel();
        rec.hospitalName = hosp->getName();
        rec.ambulanceRoute = RoadMap::routeToString(ambRoute);
        rec.hospitalRoute = RoadMap::routeToString(hospRoute);
        rec.warning = warning;
        rec.next = nullptr;
        history.push(rec);

        cout << "\n****************************************\n";
        cout << "         AMBULANCE DISPATCHED\n";
        cout << "****************************************\n";
        cout << "Patient   : " << p->getName() << " (" << severityName(p->getSeverity()) << ")\n";
        cout << "Needs     : " << p->getRequired().describe() << "\n";
        cout << "Ambulance : " << amb->getName() << " - " << amb->typeLabel() << "\n";
        cout << "Hospital  : " << hosp->getName() << "\n";
        cout << "Status    : DISPATCHED\n";
        cout << "\n  Ambulance to patient (" << locationName(amb->getLocation())
             << " -> " << locationName(p->getLocation()) << "):\n";
        showRouteReport(amb->getLocation(), p->getLocation());
        cout << "\n  Patient to hospital (" << locationName(p->getLocation())
             << " -> " << locationName(hosp->getLocation()) << "):\n";
        showRouteReport(p->getLocation(), hosp->getLocation());
        cout << "****************************************\n";
    }

    void markAmbulanceAvailable()
    {
        cout << "\nBusy ambulances:\n";
        bool any = false;
        for (int i = 0; i < NUM_AMBULANCES; i++)
        {
            if (!fleet[i]->isAvailable())
            {
                cout << "  AMB-" << fleet[i]->getId();
                if (fleet[i]->getAssignedPatientId() != 0)
                    cout << " (patient ID " << fleet[i]->getAssignedPatientId() << ")";
                cout << "\n";
                any = true;
            }
        }
        if (!any)
        {
            cout << "  None. Every ambulance is already available.\n";
            return;
        }

        int id = Input::readInt("Enter ambulance number to mark available: ", 1, NUM_AMBULANCES);
        Ambulance *a = fleet[id - 1];
        if (a->isAvailable())
        {
            cout << "AMB-" << id << " is already available.\n";
            return;
        }
        int patientId = a->getAssignedPatientId();
        a->setAvailable(true);
        a->assignPatient(0);
        if (patientId != 0)
        {
            Patient *p = patients.find(patientId);
            if (p != nullptr) p->setStatus(REGISTERED);
        }
        cout << "AMB-" << id << " is back in service.\n";
    }

    void displayPatients() const { patients.display(); }
    void displayQueue() const { queue.display(); }
    void displayHistory() const { history.display(); }
    void displayMap() const { map.display(); }

    void displayAmbulances() const
    {
        cout << "\n========== AMBULANCES ==========\n";
        for (int i = 0; i < NUM_AMBULANCES; i++)
        {
            fleet[i]->display();
            cout << "---------------------------------\n";
        }
    }

    void displayHospitals() const
    {
        cout << "\n========== HOSPITALS ==========\n";
        for (int i = 0; i < NUM_HOSPITALS; i++)
        {
            hospitals[i]->display();
            cout << "---------------------------------\n";
        }
    }

    void findRoute() const
    {
        printLocations();
        int a = Input::readInt("From (location number): ", 1, NUM_LOCATIONS) - 1;
        int b = Input::readInt("To (location number): ", 1, NUM_LOCATIONS) - 1;
        cout << "\nRoutes " << locationName(a) << " -> " << locationName(b) << ":\n";
        showRouteReport(a, b);
    }

    void toggleRoad()
    {
        printLocations();
        int a = Input::readInt("Road from (location number): ", 1, NUM_LOCATIONS) - 1;
        int b = Input::readInt("Road to (location number): ", 1, NUM_LOCATIONS) - 1;
        if (!map.roadExists(a, b))
        {
            cout << "\nThere is no direct road between " << locationName(a)
                 << " and " << locationName(b) << ".\n";
            return;
        }
        bool nowBlocked = !map.isBlocked(a, b);
        map.setBlocked(a, b, nowBlocked);
        cout << "\nRoad " << locationName(a) << " <-> " << locationName(b)
             << (nowBlocked ? " is now BLOCKED.\n" : " is open again.\n");
    }

    void loadSamplePatients()
    {
        struct Sample { int id; const char *name; int age; int loc; };
        const Sample samples[] = {
            {101, "Ravi Kumar", 45, VILLAGE_A},
            {102, "Sita Devi", 62, VILLAGE_E},
            {103, "Amit Singh", 30, RURAL_AREA},
            {104, "Meena Kumari", 8, VILLAGE_D}};
        int added = 0;
        for (const Sample &s : samples)
            if (patients.add(new Patient(s.id, s.name, s.age, s.loc))) added++;
        cout << "\n" << added << " sample patient(s) added (IDs 101-104).\n";
    }

    // ---------- main menu ----------
    void run()
    {
        int choice;
        do
        {
            cout << "\n\n";
            cout << "=========================================\n";
            cout << "              JEEVANROUTE\n";
            cout << "     Rural Emergency Response System\n";
            cout << "=========================================\n";
            cout << " 1. Register Patient\n";
            cout << " 2. Report Emergency\n";
            cout << " 3. Process Next Emergency\n";
            cout << " 4. Mark Ambulance Available\n";
            cout << " 5. Display Patients\n";
            cout << " 6. Display Ambulances\n";
            cout << " 7. Display Hospitals\n";
            cout << " 8. Display Emergency Queue\n";
            cout << " 9. Display Dispatch History\n";
            cout << "10. Show Road Map\n";
            cout << "11. Find Route Between Two Locations\n";
            cout << "12. Block / Reopen a Road\n";
            cout << "13. Load Sample Patients\n";
            cout << " 0. Exit\n";

            choice = Input::readInt("\nEnter your choice: ", 0, 13);

            switch (choice)
            {
            case 1:  registerPatient(); break;
            case 2:  reportEmergency(); break;
            case 3:  processEmergency(); break;
            case 4:  markAmbulanceAvailable(); break;
            case 5:  displayPatients(); break;
            case 6:  displayAmbulances(); break;
            case 7:  displayHospitals(); break;
            case 8:  displayQueue(); break;
            case 9:  displayHistory(); break;
            case 10: displayMap(); break;
            case 11: findRoute(); break;
            case 12: toggleRoad(); break;
            case 13: loadSamplePatients(); break;
            case 0:  cout << "\nThank you for using JEEVANROUTE!\n"; break;
            }
        } while (choice != 0);
    }
};

int main()
{
    EmergencyManager app;
    app.run();
    return 0;
}
