#include <iostream>
#include <cstring>
using namespace std;

struct Patient
{
    int id;
    char name[50];
    int age;
    char location[50];

    Patient *next;
};

Patient *head = NULL;

void registerPatient()
{
    Patient *newPatient = new Patient;

    cout << "\nEnter Patient ID: ";
    cin >> newPatient->id;

    cout << "Enter Patient Name: ";
    cin.ignore();
    cin.getline(newPatient->name, 50);

    cout << "Enter Age: ";
    cin >> newPatient->age;

    cout << "Enter Location/Village: ";
    cin.ignore();
    cin.getline(newPatient->location, 50);

    newPatient->next = NULL;

    if (head == NULL)
    {
        head = newPatient;
    }
    else
    {
        Patient *temp = head;

        while (temp->next != NULL)
        {
            temp = temp->next;
        }

        temp->next = newPatient;
    }

    cout << "\nPatient registered successfully!\n";
}

void displayPatients()
{
    if (head == NULL)
    {
        cout << "\nNo patients registered.\n";
        return;
    }

    Patient *temp = head;

    cout << "\n PATIENT LIST \n";

    while (temp != NULL)
    {
        cout << "Patient ID : " << temp->id << endl;
        cout << "Name       : " << temp->name << endl;
        cout << "Age        : " << temp->age << endl;
        cout << "Location   : " << temp->location << endl;
        temp = temp->next;
    }
}

Patient* findPatient(int id)
{
    Patient *temp = head;

    while (temp != NULL)
    {
        if (temp->id == id)
        {
            return temp;
        }

        temp = temp->next;
    }

    return NULL;
}

const int MAX_AMBULANCES = 5;

struct Ambulance
{
    int id;
    char location[50];
    bool available;
};

Ambulance ambulances[MAX_AMBULANCES];

void initializeAmbulances()
{
    ambulances[0].id = 1;
    strcpy(ambulances[0].location, "Village A");
    ambulances[0].available = true;

    ambulances[1].id = 2;
    strcpy(ambulances[1].location, "Village B");
    ambulances[1].available = true;

    ambulances[2].id = 3;
    strcpy(ambulances[2].location, "Village C");
    ambulances[2].available = false;

    ambulances[3].id = 4;
    strcpy(ambulances[3].location, "Village D");
    ambulances[3].available = true;

    ambulances[4].id = 5;
    strcpy(ambulances[4].location, "Village E");
    ambulances[4].available = false;
}

void displayAmbulances()
{
    cout << "\n AMBULANCES\n";

    for (int i = 0; i < MAX_AMBULANCES; i++)
    {
        cout << "Ambulance ID : " << ambulances[i].id << endl;
        cout << "Location     : " << ambulances[i].location << endl;

        if (ambulances[i].available)
            cout << "Status       : AVAILABLE\n";
        else
            cout << "Status       : BUSY\n";
    }
}

int findAvailableAmbulance()
{
    for (int i = 0; i < MAX_AMBULANCES; i++)
    {
        if (ambulances[i].available)
        {
            return i;
        }
    }

    return -1;
}

const int MAX_HOSPITALS = 5;

struct Hospital
{
    int id;
    char name[50];
    char location[50];
    bool icu;
    bool oxygen;
};

Hospital hospitals[MAX_HOSPITALS];

void initializeHospitals()
{
    hospitals[0].id = 1;
    strcpy(hospitals[0].name, "City Hospital");
    strcpy(hospitals[0].location, "City Center");
    hospitals[0].icu = true;
    hospitals[0].oxygen = true;

    hospitals[1].id = 2;
    strcpy(hospitals[1].name, "Rural Care Hospital");
    strcpy(hospitals[1].location, "Rural Area");
    hospitals[1].icu = false;
    hospitals[1].oxygen = true;

    hospitals[2].id = 3;
    strcpy(hospitals[2].name, "Emergency Care Hospital");
    strcpy(hospitals[2].location, "Main Road");
    hospitals[2].icu = true;
    hospitals[2].oxygen = true;

    hospitals[3].id = 4;
    strcpy(hospitals[3].name, "Community Hospital");
    strcpy(hospitals[3].location, "Village Road");
    hospitals[3].icu = false;
    hospitals[3].oxygen = false;

    hospitals[4].id = 5;
    strcpy(hospitals[4].name, "District Hospital");
    strcpy(hospitals[4].location, "District Center");
    hospitals[4].icu = true;
    hospitals[4].oxygen = true;
}

void displayHospitals()
{
    cout << "\n********* HOSPITALS *********\n";

    for (int i = 0; i < MAX_HOSPITALS; i++)
    {
        cout << "Hospital ID : " << hospitals[i].id << endl;
        cout << "Name        : " << hospitals[i].name << endl;
        cout << "Location    : " << hospitals[i].location << endl;

        cout << "ICU         : ";

        if (hospitals[i].icu)
            cout << "Available\n";
        else
            cout << "Not Available\n";

        cout << "Oxygen      : ";

        if (hospitals[i].oxygen)
            cout << "Available\n";
        else
            cout << "Not Available\n";

        cout << "*********************************\n";
    }
}

const int MAX_QUEUE = 10;

struct EmergencyQueue
{
    int queue[MAX_QUEUE];
    int front;
    int rear;
};

EmergencyQueue emergency;

void initializeQueue()
{
    emergency.front = -1;
    emergency.rear = -1;
}

bool isQueueEmpty()
{
    return emergency.front == -1;
}

bool isQueueFull()
{
    return emergency.rear == MAX_QUEUE - 1;
}

void addEmergency()
{
    int patientId;

    cout << "\nEnter Patient ID: ";
    cin >> patientId;

    Patient *patient = findPatient(patientId);

    if (patient == NULL)
    {
        cout << "\nPatient not found!\n";
        return;
    }

    if (isQueueFull())
    {
        cout << "\nEmergency queue is full!\n";
        return;
    }

    if (emergency.front == -1)
    {
        emergency.front = 0;
    }

    emergency.rear++;

    emergency.queue[emergency.rear] = patientId;

    cout << "\nEmergency request added successfully!\n";
}

void displayEmergencyQueue()
{
    if (isQueueEmpty())
    {
        cout << "\nEmergency queue is empty.\n";
        return;
    }

    cout << "\n********** EMERGENCY QUEUE **********\n";

    for (int i = emergency.front; i <= emergency.rear; i++)
    {
        Patient *patient = findPatient(emergency.queue[i]);

        if (patient != NULL)
        {
            cout << "Patient ID : " << patient->id << endl;
            cout << "Name       : " << patient->name << endl;
            cout << "Location   : " << patient->location << endl;
            cout << "***************************\n";
        }
    }
}

int removeEmergency()
{
    if (isQueueEmpty())
    {
        return -1;
    }

    int patientId = emergency.queue[emergency.front];

    emergency.front++;

    if (emergency.front > emergency.rear)
    {
        emergency.front = -1;
        emergency.rear = -1;
    }

    return patientId;
}

const int MAX_HISTORY = 10;

struct Dispatch
{
    int patientId;
    int ambulanceId;
    int hospitalId;
};

Dispatch history[MAX_HISTORY];

int top = -1;

void pushHistory(int patientId, int ambulanceId, int hospitalId)
{
    if (top == MAX_HISTORY - 1)
    {
        cout << "\nDispatch history is full!\n";
        return;
    }

    top++;

    history[top].patientId = patientId;
    history[top].ambulanceId = ambulanceId;
    history[top].hospitalId = hospitalId;
}

void displayHistory()
{
    if (top == -1)
    {
        cout << "\nNo completed emergencies yet.\n";
        return;
    }

    cout << "\n********** DISPATCH HISTORY ************\n";

    for (int i = top; i >= 0; i--)
    {
        Patient *patient = findPatient(history[i].patientId);

        cout << "Patient ID    : "
             << history[i].patientId << endl;

        if (patient != NULL)
        {
            cout << "Patient Name  : "
                 << patient->name << endl;
        }

        cout << "Ambulance ID  : "
             << history[i].ambulanceId << endl;

        cout << "Hospital ID   : "
             << history[i].hospitalId << endl;

        cout << "****************************\n";
    }
}

void processEmergency()
{
    if (isQueueEmpty())
    {
        cout << "\nNo emergency requests available.\n";
        return;
    }

    int patientId = removeEmergency();

    Patient *patient = findPatient(patientId);

    if (patient == NULL)
    {
        cout << "\nPatient not found!\n";
        return;
    }

    cout << "\n********** PROCESSING EMERGENCY *********\n";

    cout << "Patient ID : " << patient->id << endl;
    cout << "Name       : " << patient->name << endl;
    cout << "Age        : " << patient->age << endl;
    cout << "Location   : " << patient->location << endl;

    int ambulanceIndex = findAvailableAmbulance();

    if (ambulanceIndex == -1)
    {
        cout << "\nNo ambulance is currently available.\n";

        if (emergency.front == -1)
        {
            emergency.front = 0;
            emergency.rear = 0;
        }
        else
        {
            emergency.rear++;
        }

        emergency.queue[emergency.rear] = patientId;

        return;
    }

    cout << "\nAvailable ambulance found.";

    cout << "\nAmbulance ID : "
         << ambulances[ambulanceIndex].id << endl;

    displayHospitals();

    int hospitalId;

    cout << "\nSelect Hospital ID: ";
    cin >> hospitalId;

    if (hospitalId < 1 || hospitalId > MAX_HOSPITALS)
    {
        cout << "\nInvalid hospital ID!\n";
        return;
    }

    int hospitalIndex = hospitalId - 1;

    ambulances[ambulanceIndex].available = false;

    pushHistory(
        patientId,
        ambulances[ambulanceIndex].id,
        hospitals[hospitalIndex].id
    );

    cout << "\n****************************************\n";
    cout << "         AMBULANCE DISPATCHED\n";
    cout << "******************************************\n";

    cout << "Patient   : "
         << patient->name << endl;

    cout << "Ambulance : AMB-"
         << ambulances[ambulanceIndex].id << endl;

    cout << "Hospital  : "
         << hospitals[hospitalIndex].name << endl;

    cout << "Status    : DISPATCHED\n";

    cout << "***************************************\n";
}

int main()
{
    initializeAmbulances();
    initializeHospitals();
    initializeQueue();

    int choice;

    do
    {
        cout << "\n\n";
        cout << "=========================================\n";
        cout << "           JEEVANROUTE \n";
        cout << "   Rural Emergency Response System\n";
        cout << "=========================================\n";

        cout << "1. Register Patient\n";
        cout << "2. Report Emergency\n";
        cout << "3. Process Emergency\n";
        cout << "4. Display Patients\n";
        cout << "5. Display Ambulances\n";
        cout << "6. Display Hospitals\n";
        cout << "7. Display Emergency Queue\n";
        cout << "8. Display Dispatch History\n";
        cout << "0. Exit\n";

        cout << "\nEnter your choice: ";
        cin >> choice;

        switch (choice)
        {
            case 1:
                registerPatient();
                break;

            case 2:
                addEmergency();
                break;

            case 3:
                processEmergency();
                break;

            case 4:
                displayPatients();
                break;

            case 5:
                displayAmbulances();
                break;

            case 6:
                displayHospitals();
                break;

            case 7:
                displayEmergencyQueue();
                break;

            case 8:
                displayHistory();
                break;

            case 0:
                cout << "\nThank you for using JEEVANROUTE!\n";
                break;

            default:
                cout << "\nInvalid choice!\n";
        }

    } while (choice != 0);

    return 0;
}