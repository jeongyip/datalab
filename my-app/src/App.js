import React, { Component } from 'react';
import logo from './logo.svg';
import moment from 'moment';
import _ from 'lodash';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Brush, Legend,
  ReferenceArea, ReferenceLine, ReferenceDot, ResponsiveContainer,
  LabelList, Label } from 'recharts';
import './App.css';
import 'react-dates/initialize';
import { DateRangePicker, SingleDatePicker, DayPickerRangeController } from 'react-dates';
import 'react-dates/lib/css/_datepicker.css';
import {Checkbox, CheckboxGroup} from 'react-checkbox-group';

const request = require('superagent');

const CLIENT_ID = 'AT_F0Fr9a_0bbr5GgUim';
const CLIENT_KEY = 'fsVm8wYtl_';
const API_URL = '/v1/datalab/search';

const colors = ['#ed6b85', '#1080aa', '#4caf50', '#ff9800', '#fad25b'];
const ageArr = ['0-12','19-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60+'];

class App extends Component {
  constructor() {
    super();
    this.requestBody = this.requestBody.bind(this);
    this.showAlert = this.showAlert.bind(this);
    this.changeText = this.changeText.bind(this);
    this.handleGenderChange = this.handleGenderChange.bind(this);
    this.handleAgeChange = this.handleAgeChange.bind(this);
    this.renderSettingBox = this.renderSettingBox.bind(this);
    this.renderChart = this.renderChart.bind(this);
    this.state = {
      ageFilter: [],
      genderFilter: [],
      isOpen: false,
      keywords: [],
      data: {},
      startDate: moment(),
      endDate: moment(),
      focusedInput: 'START_DATE',
      textValue: '',
      request_body: {
        "startDate": '',
        "endDate": '',
        "timeUnit": "date",
        "keywordGroups": [],
        "ages": [
          "1",
          "2"
        ]
      }
    }
  }

  addKeyword() {
    const tempKeywords =_.map(this.state.keywords, _.clone);
    if( tempKeywords.length < 5) {
      tempKeywords.push(
      {
        "groupName": this.state.textValue,
        "keywords": [
            this.state.textValue
        ]
      }
    );

    this.setState({
      textValue: '',
      keywords: tempKeywords,
    });
    }
  }

  requestBody() {
    const self = this;

    //리퀘스트 바디로 다 합치기
    this.setState({
      request_body: _.merge(this.state.request_body, {
        "startDate": this.state.startDate.format("YYYY-MM-DD"),
        "endDate": this.state.endDate.format("YYYY-MM-DD"),
        "keywordGroups": this.state.keywords,
        "ages": this.state.ageFilter,
      })
    });

    request
       .post(API_URL)
       .send(JSON.stringify(self.state.request_body))
       .set('X-Naver-Client-Id', CLIENT_ID)
       .set('X-Naver-Client-Secret',CLIENT_KEY)
       .set('Content-Type', 'application/json')
       .end(function(err, res){
         if (err || !res.ok) {
           alert('Oh no! error');
           console.log(err);
         } else {
           self.setState({ data: res.body.results });
           console.log(self.state.data);
         }
    });
  }

  changeText(e) {
    this.setState({textValue: e.target.value});
  }

  handleGenderChange(value) {
    this.setState({ genderFilter: value });
  }

  handleAgeChange(value){
    this.setState({ ageFilter: value });
  }

  showAlert() {
    alert('검색어를 입력해주세요');
  }

  renderSettingBox() {
    return (
      <div>
        <CheckboxGroup className="top-margin-8" name="gender" onChange={this.handleGenderChange}>
          <span><strong>성별  </strong></span>
          <label className="filter"><Checkbox value="f"/>여자</label>
          <label className="filter"><Checkbox value="m"/>남자</label>
        </CheckboxGroup>
        <CheckboxGroup className="top-margin-8" name="age" onChange={this.handleAgeChange}>
          <span><strong>나이  </strong></span>
          { ageArr.map((o, i) =>
              <label className="filter"><Checkbox value={`${i+1}`}/>{o}세</label>
            )
          }
        </CheckboxGroup>
      </div>
    );
  }

  renderChart() {
    const result = this.state.data;
    var wholeData = [];
    var wholeKey = [];

    if( result.length > 1){
      for(var i=0; i<result.length; i++){
        var rename = result[i].title;
        wholeKey.push(rename);
        for(var j=0; j<result[0].data.length; j++){
          wholeData[j] =  _.merge(wholeData[j], {
            'period': result[i].data[j].period,
            'ratio': result[i].data[j].ratio,
          })
          Object.defineProperty(wholeData[j], rename,
          Object.getOwnPropertyDescriptor(wholeData[j], 'ratio'));
          delete wholeData[j]['ratio'];
        }
      }
    }

    return (
      <div className="chart-div">
        { result.map(i =>
          <div>
            <h3 className="no-margin-bottom" >✔️{i.title}에 대한 그래프에요</h3>
            <div className="description">
              <span>🌟 {i.title}에 대해 더 궁금하다면? </span>
              <a href={`https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=1&ie=utf8&query=${i.title}`} target="_blank">>여기</a>
            </div>
            <LineChart width={600} height={300} data={ i.data } margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <Line type="monotone" dataKey="ratio" stroke="#8884d8" />
              <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
            </LineChart>
          </div>)
        }
        {
          wholeData.length > 0 &&
          <div>
            <h3>✔전체 키워드에 대한 그래프에요</h3>
            <LineChart width={730} height={250} data={wholeData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              {
                wholeKey.map((o, index) => <Line type="monotone" dataKey={o} stroke={ colors[index]} /> )
              }
            </LineChart>
          </div>
        }
      </div>
    );
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <div>
            <div className="header">
              <h1 className="title color-white">어떤 키워드가<br />궁금한가요?</h1>
              <div>
                <DateRangePicker
                  startDate={this.state.startDate} // momentPropTypes.momentObj or null,
                  endDate={this.state.endDate}  // momentPropTypes.momentObj or null,
                  onDatesChange={({ startDate, endDate }) => this.setState({ startDate, endDate })} // PropTypes.func.isRequired,
                  focusedInput={this.state.focusedInput} // PropTypes.oneOf([START_DATE, END_DATE]) or null,
                  onFocusChange={focusedInput => this.setState({ focusedInput })} // PropTypes.func.isRequired,
                  isOutsideRange={() => false}
                />
              </div>
              <div className="input-container">
                <input className="data-box" type="text" value={this.state.textValue} placeholder='검색어를 입력해주세요' onChange={this.changeText}/>
                <span className="plus-btn" onClick={ () => this.addKeyword() }>+</span>
              </div>
              <div className="tag-div">
              { this.state.keywords.map(e => <span className="tag">#{e.groupName} </span>) }
              </div>
              <div>
                <div className="setting-box" onClick={ () => this.setState({ isOpen: !this.state.isOpen }) }>
                  <h2 className="color-white margin-8">> 검색 조건 상세 설정</h2>
                </div>
              </div>
              { this.state.isOpen && this.renderSettingBox() }
              <div className="search-btn" onClick={ this.state.keywords.length > 0 ? this.requestBody : this.showAlert }>
                <span className="margin-8 padding-8 color-white">검색하기</span>
              </div>
            </div>
            {
              this.state.data.length > 0 && this.renderChart()
            }
          </div>
        </header>
      </div>
    );
  }
}

export default App;
