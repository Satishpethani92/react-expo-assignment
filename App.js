import * as React from 'react';
import { Text, View, StyleSheet, TextInput, ScrollView, AsyncStorage } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import moment from 'moment';

export default function App() {

  const [catData, setCatData] = React.useState([])
  const [query, setQuery] = React.useState('')

  const fetchServerData = async () => {
    fetch(`https://api.publicapis.org/entries`, {
      method: 'GET'
    })
      .then(response => response.json())
      .then(async response => {
        const catList = response

        setCatData(catList.entries)

        try {
          // write file for new response
          const lastTimeStamp = moment().toDate().getTime()
          const fileName = `response_${lastTimeStamp}.json`

          AsyncStorage.setItem('lastTimeStamp', `${lastTimeStamp}`)

          await FileSystem.writeAsStringAsync(`${FileSystem.documentDirectory}${fileName}`, JSON.stringify(catList.entries), {
            encoding: FileSystem.EncodingType.UTF8
          })

        } catch (err) {
          console.log('err:: ', err)
        }
      })
  }

  React.useEffect(async () => {
    const fileList = await FileSystem.readDirectoryAsync(FileSystem.documentDirectory)

    console.log(fileList, fileList[fileList.length - 1])

    const lastFile = fileList[fileList.length - 1]
    const timeStamp = await AsyncStorage.getItem('lastTimeStamp')

    console.log(timeStamp, moment().diff(moment(parseInt(timeStamp)), 'second'))

    if (timeStamp && moment(moment().toDate().getTime()).diff(moment(parseInt(timeStamp)), 'second') > 30) {
      console.log('REFRESH LOCAL FILE WITH NEW DATA')
      // if file timestamp is more than 30, fetch new data
      fetchServerData()
    } else if (timeStamp) {
      console.log('EXISTING DATA')
      // fetch file data
      const fileResponse = await FileSystem.readAsStringAsync(`${FileSystem.documentDirectory}response_${timeStamp}`, {
        encoding: FileSystem.EncodingType.UTF8
      })
      setCatData(JSON.parse(fileResponse))
    } else {
      // app is new so fetch data at first instance and save in file
      fetchServerData()
      console.log('NEW APP')
    }


  }, [])

  // filter to display unique category
  const filteredData = catData.filter((e, index) => catData[index - 1]?.Category != catData[index].Category)
  // console.log('catData', JSON.stringify(catData))


  return (
    <View style={styles.container}>
      <TextInput
        value={query}
        onChangeText={(query1) => {
          setQuery(query1)
        }}
      />
      <ScrollView>
        {/* If you want to display unique category list, uncomment below */}
        {/* filteredData.map(e => {
        return (
          <Text style={styles.paragraph}>
            {e.Category}
          </Text>
        )
      }) */}

        {catData.filter(e => e.Category.includes(query)).map((e, index) => {
          return (
            <Text style={styles.paragraph} key={`${index}`}>
              {e.API}
            </Text>
          )
        })}
      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
