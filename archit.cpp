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